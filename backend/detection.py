from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from events import NetworkEvent
from alerts import Alert
from rules import DetectionRule
from models import Asset


# ============================================================
# Rule Configuration Helper
# ============================================================

def get_rule(
    db: Session,
    rule_type: str,
):
    return (
        db.query(DetectionRule)
        .filter(
            DetectionRule.rule_type == rule_type
        )
        .first()
    )


# ============================================================
# Port Scan Detection
# ============================================================

def detect_port_scan(
    db: Session,
    source_ip: str,
):
    rule = get_rule(
        db,
        "POSSIBLE_PORT_SCAN",
    )

    if rule and not rule.enabled:
        return None

    threshold = rule.threshold if rule else 5
    window_seconds = rule.window_seconds if rule else 60
    risk_score = rule.risk_score if rule else 85
    severity = rule.severity if rule else "HIGH"

    window_start = (
        datetime.utcnow()
        - timedelta(seconds=window_seconds)
    )

    events = (
        db.query(NetworkEvent)
        .filter(
            NetworkEvent.source_ip == source_ip,
            NetworkEvent.timestamp >= window_start,
            NetworkEvent.protocol == "TCP",
            NetworkEvent.event_type == "TCP_CONNECTION_ATTEMPT",
        )
        .all()
    )

    destination_ports = {
        event.destination_port
        for event in events
        if event.destination_port is not None
    }

    if len(destination_ports) < threshold:
        return None

    existing_alert = (
        db.query(Alert)
        .filter(
            Alert.alert_type == "POSSIBLE_PORT_SCAN",
            Alert.source_ip == source_ip,
            Alert.status != "RESOLVED",
        )
        .first()
    )

    if existing_alert:
        return None

    alert = Alert(
        alert_type="POSSIBLE_PORT_SCAN",
        severity=severity,
        risk_score=risk_score,
        source_ip=source_ip,
        protocol="TCP",
        description=(
            f"Possible port scan detected from {source_ip}. "
            f"{len(destination_ports)} different destination "
            f"ports were observed within {window_seconds} seconds."
        ),
        status="NEW",
    )

    db.add(alert)
    db.flush()

    return alert


# ============================================================
# Repeated Connection Detection
# ============================================================

def detect_repeated_connections(
    db: Session,
    source_ip: str,
    destination_ip: str,
    destination_port: int | None,
):
    rule = get_rule(
        db,
        "REPEATED_CONNECTION_ATTEMPTS",
    )

    if rule and not rule.enabled:
        return None

    threshold = rule.threshold if rule else 5
    window_seconds = rule.window_seconds if rule else 60
    risk_score = rule.risk_score if rule else 55
    severity = rule.severity if rule else "MEDIUM"

    window_start = (
        datetime.utcnow()
        - timedelta(seconds=window_seconds)
    )

    query = (
        db.query(NetworkEvent)
        .filter(
            NetworkEvent.source_ip == source_ip,
            NetworkEvent.destination_ip == destination_ip,
            NetworkEvent.timestamp >= window_start,
            NetworkEvent.protocol == "TCP",
            NetworkEvent.event_type == "TCP_CONNECTION_ATTEMPT",
        )
    )

    if destination_port is not None:
        query = query.filter(
            NetworkEvent.destination_port == destination_port
        )

    events = query.all()

    if len(events) < threshold:
        return None

    existing_alert = (
        db.query(Alert)
        .filter(
            Alert.alert_type == "REPEATED_CONNECTION_ATTEMPTS",
            Alert.source_ip == source_ip,
            Alert.destination_ip == destination_ip,
            Alert.status != "RESOLVED",
        )
        .first()
    )

    if existing_alert:
        return None

    alert = Alert(
        alert_type="REPEATED_CONNECTION_ATTEMPTS",
        severity=severity,
        risk_score=risk_score,
        source_ip=source_ip,
        destination_ip=destination_ip,
        protocol="TCP",
        description=(
            f"Repeated connection attempts detected from "
            f"{source_ip} to {destination_ip}. "
            f"{len(events)} connection attempts were observed "
            f"within {window_seconds} seconds."
        ),
        status="NEW",
    )

    db.add(alert)
    db.flush()

    return alert


# ============================================================
# Host Sweep Detection
# ============================================================

def detect_host_sweep(
    db: Session,
    source_ip: str,
):
    rule = get_rule(
        db,
        "POSSIBLE_HOST_SWEEP",
    )

    if rule and not rule.enabled:
        return None

    threshold = rule.threshold if rule else 3
    window_seconds = rule.window_seconds if rule else 60
    risk_score = rule.risk_score if rule else 75
    severity = rule.severity if rule else "HIGH"

    window_start = (
        datetime.utcnow()
        - timedelta(seconds=window_seconds)
    )

    events = (
        db.query(NetworkEvent)
        .filter(
            NetworkEvent.source_ip == source_ip,
            NetworkEvent.timestamp >= window_start,
            NetworkEvent.protocol == "TCP",
            NetworkEvent.event_type == "TCP_CONNECTION_ATTEMPT",
        )
        .all()
    )

    destination_hosts = {
        event.destination_ip
        for event in events
        if event.destination_ip
        and event.destination_ip != source_ip
    }

    if len(destination_hosts) < threshold:
        return None

    existing_alert = (
        db.query(Alert)
        .filter(
            Alert.alert_type == "POSSIBLE_HOST_SWEEP",
            Alert.source_ip == source_ip,
            Alert.status != "RESOLVED",
        )
        .first()
    )

    if existing_alert:
        return None

    alert = Alert(
        alert_type="POSSIBLE_HOST_SWEEP",
        severity=severity,
        risk_score=risk_score,
        source_ip=source_ip,
        protocol="TCP",
        description=(
            f"Possible host sweep detected from {source_ip}. "
            f"{len(destination_hosts)} different destination "
            f"hosts were contacted within {window_seconds} seconds."
        ),
        status="NEW",
    )

    db.add(alert)
    db.flush()

    return alert


# ============================================================
# High Connection Rate Detection
# ============================================================

def detect_high_connection_rate(
    db: Session,
    source_ip: str,
):
    rule = get_rule(
        db,
        "HIGH_CONNECTION_RATE",
    )

    if rule and not rule.enabled:
        return None

    threshold = rule.threshold if rule else 20
    window_seconds = rule.window_seconds if rule else 60
    risk_score = rule.risk_score if rule else 80
    severity = rule.severity if rule else "HIGH"

    window_start = (
        datetime.utcnow()
        - timedelta(seconds=window_seconds)
    )

    events = (
        db.query(NetworkEvent)
        .filter(
            NetworkEvent.source_ip == source_ip,
            NetworkEvent.timestamp >= window_start,
            NetworkEvent.protocol == "TCP",
            NetworkEvent.event_type == "TCP_CONNECTION_ATTEMPT",
        )
        .all()
    )

    connection_count = len(events)

    if connection_count < threshold:
        return None

    existing_alert = (
        db.query(Alert)
        .filter(
            Alert.alert_type == "HIGH_CONNECTION_RATE",
            Alert.source_ip == source_ip,
            Alert.status != "RESOLVED",
        )
        .first()
    )

    if existing_alert:
        return None

    alert = Alert(
        alert_type="HIGH_CONNECTION_RATE",
        severity=severity,
        risk_score=risk_score,
        source_ip=source_ip,
        protocol="TCP",
        description=(
            f"High connection rate detected from "
            f"{source_ip}. "
            f"{connection_count} TCP connection attempts "
            f"were observed within {window_seconds} seconds."
        ),
        status="NEW",
    )

    db.add(alert)
    db.flush()

    return alert


# ============================================================
# Unknown Device Detection
# ============================================================

def detect_unknown_device(
    db: Session,
    source_ip: str,
):
    rule = get_rule(
        db,
        "UNKNOWN_DEVICE",
    )

    if rule and not rule.enabled:
        return None

    risk_score = rule.risk_score if rule else 60
    severity = rule.severity if rule else "MEDIUM"

    # Check whether the source IP exists
    # in the known asset inventory.
    asset = (
        db.query(Asset)
        .filter(
            Asset.ip == source_ip
        )
        .first()
    )

    # Known device → no alert.
    if asset:
        return None

    # Prevent duplicate unresolved alerts.
    existing_alert = (
        db.query(Alert)
        .filter(
            Alert.alert_type == "UNKNOWN_DEVICE",
            Alert.source_ip == source_ip,
            Alert.status != "RESOLVED",
        )
        .first()
    )

    if existing_alert:
        return None

    alert = Alert(
        alert_type="UNKNOWN_DEVICE",
        severity=severity,
        risk_score=risk_score,
        source_ip=source_ip,
        protocol="TCP",
        description=(
            f"Network activity detected from unknown device "
            f"{source_ip}. The source IP is not currently "
            f"present in the asset inventory."
        ),
        status="NEW",
    )

    db.add(alert)
    db.flush()

    return alert