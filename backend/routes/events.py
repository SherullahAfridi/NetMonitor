from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from events import NetworkEvent
from detection import (
    detect_port_scan,
    detect_repeated_connections,
    detect_host_sweep,
    detect_high_connection_rate,
    detect_unknown_device,
)

router = APIRouter(
    prefix="/api/events",
    tags=["Events"],
)


@router.get("/")
def get_events(db: Session = Depends(get_db)):
    return (
        db.query(NetworkEvent)
        .order_by(NetworkEvent.timestamp.desc())
        .all()
    )


@router.get("/{event_id}")
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
):
    event = (
        db.query(NetworkEvent)
        .filter(NetworkEvent.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )

    return event


@router.post("/")
def create_event(
    source_ip: str | None = None,
    destination_ip: str | None = None,
    source_port: int | None = None,
    destination_port: int | None = None,
    protocol: str | None = None,
    event_type: str = "NETWORK_ACTIVITY",
    description: str | None = None,
    db: Session = Depends(get_db),
):
    event = NetworkEvent(
        source_ip=source_ip,
        destination_ip=destination_ip,
        source_port=source_port,
        destination_port=destination_port,
        protocol=protocol,
        event_type=event_type,
        description=description,
    )

    db.add(event)
    db.flush()

    alerts_created = []

    # ========================================================
    # 1. Port Scan Detection
    # ========================================================

    if source_ip:
        port_scan_alert = detect_port_scan(
            db=db,
            source_ip=source_ip,
        )

        if port_scan_alert:
            alerts_created.append(
                port_scan_alert
            )

    # ========================================================
    # 2. High Connection Rate Detection
    # ========================================================

    if source_ip:
        high_connection_rate_alert = (
            detect_high_connection_rate(
                db=db,
                source_ip=source_ip,
            )
        )

        if high_connection_rate_alert:
            alerts_created.append(
                high_connection_rate_alert
            )

    # ========================================================
    # 3. Repeated Connection Detection
    # ========================================================

    if source_ip and destination_ip:
        repeated_connection_alert = (
            detect_repeated_connections(
                db=db,
                source_ip=source_ip,
                destination_ip=destination_ip,
                destination_port=destination_port,
            )
        )

        if repeated_connection_alert:
            alerts_created.append(
                repeated_connection_alert
            )

    # ========================================================
    # 4. Host Sweep Detection
    # ========================================================

    if source_ip:
        host_sweep_alert = detect_host_sweep(
            db=db,
            source_ip=source_ip,
        )

        if host_sweep_alert:
            alerts_created.append(
                host_sweep_alert
            )

    # ========================================================
    # 5. Unknown Device Detection
    # ========================================================

    if source_ip:
        unknown_device_alert = detect_unknown_device(
            db=db,
            source_ip=source_ip,
        )

        if unknown_device_alert:
            alerts_created.append(
                unknown_device_alert
            )

    db.commit()
    db.refresh(event)

    # ========================================================
    # JSON-friendly Alert Response
    # ========================================================

    alert_response = []

    for alert in alerts_created:
        alert_response.append(
            {
                "id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "risk_score": alert.risk_score,
                "source_ip": alert.source_ip,
                "destination_ip": alert.destination_ip,
                "protocol": alert.protocol,
                "description": alert.description,
                "status": alert.status,
                "detected_at": alert.detected_at,
            }
        )

    return {
        "event": event,
        "alerts": alert_response,
    }