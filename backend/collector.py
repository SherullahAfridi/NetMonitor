from datetime import datetime
from threading import Event, Lock, Thread
import ipaddress

from scapy.all import sniff, IP, TCP, UDP, ICMP

from database import SessionLocal
from events import NetworkEvent
from detection import (
    detect_port_scan,
    detect_repeated_connections,
    detect_host_sweep,
    detect_high_connection_rate,
    detect_unknown_device,
)


COLLECTOR_RUNNING = False
COLLECTOR_STOP_EVENT = Event()
COLLECTOR_THREAD = None


NETWORK_INTERFACE = (
    r"\Device\NPF_{9E491F85-CB21-4F71-8316-2B5969A97B9D}"
)

MONITORED_NETWORK = ipaddress.ip_network(
    "192.168.1.0/24"
)

# Prevent repeated UDP packets from flooding the database.
UDP_DEDUPLICATION_SECONDS = 5
_recent_udp_events = {}
_udp_lock = Lock()


def should_record_udp(
    source_ip: str,
    destination_ip: str,
    source_port: int,
    destination_port: int,
):
    now = datetime.utcnow()
    key = (
        source_ip,
        destination_ip,
        source_port,
        destination_port,
    )

    with _udp_lock:
        last_seen = _recent_udp_events.get(key)

        if last_seen is not None:
            elapsed = (
                now - last_seen
            ).total_seconds()

            if elapsed < UDP_DEDUPLICATION_SECONDS:
                return False

        _recent_udp_events[key] = now

        expired_keys = [
            item_key
            for item_key, timestamp
            in _recent_udp_events.items()
            if (
                now - timestamp
            ).total_seconds()
            > UDP_DEDUPLICATION_SECONDS * 2
        ]

        for item_key in expired_keys:
            del _recent_udp_events[item_key]

    return True


def is_local_source(source_ip: str) -> bool:
    try:
        return ipaddress.ip_address(source_ip) in MONITORED_NETWORK
    except ValueError:
        return False


def run_detection(
    db,
    source_ip,
    destination_ip,
    destination_port,
):
    alerts_created = []

    # ---------------------------------------------------------
    # Port Scan Detection
    # ---------------------------------------------------------
    if source_ip:
        port_scan_alert = detect_port_scan(
            db=db,
            source_ip=source_ip,
        )
        if port_scan_alert:
            alerts_created.append(port_scan_alert)

    # ---------------------------------------------------------
    # High Connection Rate Detection
    # ---------------------------------------------------------
    if source_ip:
        high_connection_rate_alert = detect_high_connection_rate(
            db=db,
            source_ip=source_ip,
        )
        if high_connection_rate_alert:
            alerts_created.append(high_connection_rate_alert)

    # ---------------------------------------------------------
    # Repeated Connection Detection
    # ---------------------------------------------------------
    if source_ip and destination_ip:
        repeated_connection_alert = detect_repeated_connections(
            db=db,
            source_ip=source_ip,
            destination_ip=destination_ip,
            destination_port=destination_port,
        )
        if repeated_connection_alert:
            alerts_created.append(repeated_connection_alert)

    # ---------------------------------------------------------
    # Host Sweep Detection
    # ---------------------------------------------------------
    if source_ip:
        host_sweep_alert = detect_host_sweep(
            db=db,
            source_ip=source_ip,
        )
        if host_sweep_alert:
            alerts_created.append(host_sweep_alert)

    # ---------------------------------------------------------
    # Unknown Device Detection
    # Only treat an unknown LOCAL source as a possible new device.
    # Internet/public source addresses are not local assets.
    # ---------------------------------------------------------
    if source_ip and is_local_source(source_ip):
        unknown_device_alert = detect_unknown_device(
            db=db,
            source_ip=source_ip,
        )
        if unknown_device_alert:
            alerts_created.append(unknown_device_alert)

    return alerts_created


def process_packet(packet):
    if not packet.haslayer(IP):
        return

    ip_layer = packet[IP]
    source_ip = ip_layer.src
    destination_ip = ip_layer.dst

    protocol = None
    source_port = None
    destination_port = None
    event_type = None
    description = None

    # ---------------------------------------------------------
    # TCP CONNECTION ATTEMPTS
    # ---------------------------------------------------------
    if packet.haslayer(TCP):
        tcp_layer = packet[TCP]
        flags = str(tcp_layer.flags)

        # Only record initial TCP connection attempts.
        # SYN without ACK = connection attempt.
        if "S" not in flags or "A" in flags:
            return

        protocol = "TCP"
        source_port = tcp_layer.sport
        destination_port = tcp_layer.dport
        event_type = "TCP_CONNECTION_ATTEMPT"
        description = (
            f"TCP connection attempt from "
            f"{source_ip}:{source_port} to "
            f"{destination_ip}:{destination_port}."
        )

    # ---------------------------------------------------------
    # UDP TRAFFIC
    # ---------------------------------------------------------
    elif packet.haslayer(UDP):
        udp_layer = packet[UDP]
        source_port = udp_layer.sport
        destination_port = udp_layer.dport

        if not should_record_udp(
            source_ip,
            destination_ip,
            source_port,
            destination_port,
        ):
            return

        protocol = "UDP"
        event_type = "UDP_TRAFFIC"
        description = (
            f"UDP traffic observed from "
            f"{source_ip}:{source_port} to "
            f"{destination_ip}:{destination_port}."
        )

    # ---------------------------------------------------------
    # ICMP ECHO REQUESTS
    # ---------------------------------------------------------
    elif packet.haslayer(ICMP):
        icmp_layer = packet[ICMP]

        # ICMP type 8 = Echo Request
        if icmp_layer.type != 8:
            return

        protocol = "ICMP"
        event_type = "ICMP_ECHO_REQUEST"
        description = (
            f"ICMP echo request from "
            f"{source_ip} to {destination_ip}."
        )

    else:
        return

    db = SessionLocal()

    try:
        event = NetworkEvent(
            source_ip=source_ip,
            destination_ip=destination_ip,
            source_port=source_port,
            destination_port=destination_port,
            protocol=protocol,
            event_type=event_type,
            description=description,
            timestamp=datetime.utcnow(),
        )

        db.add(event)

        # Make the event available to detection queries
        # before the transaction is committed.
        db.flush()

        alerts_created = run_detection(
            db=db,
            source_ip=source_ip,
            destination_ip=destination_ip,
            destination_port=destination_port,
        )

        db.commit()

        if alerts_created:
            for alert in alerts_created:
                print(
                    f"[Detection] {alert.alert_type} | "
                    f"Severity: {alert.severity} | "
                    f"Risk: {alert.risk_score} | "
                    f"Source: {alert.source_ip}"
                )

    except Exception as error:
        db.rollback()
        print(
            f"[Collector] Failed to process event: "
            f"{error}"
        )

    finally:
        db.close()


def start_collector():
    global COLLECTOR_RUNNING

    if COLLECTOR_RUNNING:
        print("[Collector] Already running.")
        return

    COLLECTOR_STOP_EVENT.clear()
    COLLECTOR_RUNNING = True

    print("[Collector] Starting network packet collector...")
    print("[Collector] Monitoring authorized network traffic.")
    print(f"[Collector] Interface: {NETWORK_INTERFACE}")
    print(f"[Collector] Network: {MONITORED_NETWORK}")

    try:
        # A short timeout lets the loop notice a stop request promptly.
        while not COLLECTOR_STOP_EVENT.is_set():
            sniff(
                iface=NETWORK_INTERFACE,
                prn=process_packet,
                store=False,
                timeout=1,
            )

    except Exception as error:
        print(
            f"[Collector] Collector stopped: {error}"
        )

    finally:
        COLLECTOR_RUNNING = False
        COLLECTOR_STOP_EVENT.clear()
        print("[Collector] Network packet collector stopped.")


def start_collector_background():
    global COLLECTOR_THREAD

    if COLLECTOR_RUNNING:
        return COLLECTOR_THREAD

    COLLECTOR_THREAD = Thread(
        target=start_collector,
        daemon=True,
        name="NetMonitorCollector",
    )
    COLLECTOR_THREAD.start()
    return COLLECTOR_THREAD


def stop_collector():
    if not COLLECTOR_RUNNING:
        return False

    COLLECTOR_STOP_EVENT.set()
    return True
