import subprocess
import xml.etree.ElementTree as ET


def scan_network(target: str):
    result = subprocess.run(
        [
            "nmap",
            "-sn",
            "-oX",
            "-",
            target,
        ],
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())

    root = ET.fromstring(result.stdout)

    hosts = []

    for host in root.findall("host"):
        status = host.find("status")

        if status is not None and status.get("state") != "up":
            continue

        addresses = host.findall("address")

        ip_address = None
        mac_address = None
        vendor = None

        for address in addresses:
            address_type = address.get("addrtype")

            if address_type == "ipv4":
                ip_address = address.get("addr")

            elif address_type == "mac":
                mac_address = address.get("addr")
                vendor = address.get("vendor")

        hostnames = host.find("hostnames")
        hostname = None

        if hostnames is not None:
            hostname_node = hostnames.find("hostname")

            if hostname_node is not None:
                hostname = hostname_node.get("name")

        hosts.append(
            {
                "ip": ip_address,
                "mac": mac_address,
                "hostname": hostname,
                "vendor": vendor,
            }
        )

    return hosts