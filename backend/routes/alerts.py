from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from alerts import Alert
from correlation import calculate_correlated_risk


router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"],
)


@router.get("/")
def get_alerts(
    db: Session = Depends(get_db),
):
    return (
        db.query(Alert)
        .order_by(Alert.detected_at.desc())
        .all()
    )


@router.get("/{alert_id}")
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
):
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    return alert


@router.get("/correlation/{source_ip}")
def get_alert_correlation(
    source_ip: str,
    db: Session = Depends(get_db),
):
    return calculate_correlated_risk(
        db=db,
        source_ip=source_ip,
    )


@router.patch("/{alert_id}/status")
def update_alert_status(
    alert_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    allowed_statuses = {
        "NEW",
        "INVESTIGATING",
        "RESOLVED",
        "FALSE_POSITIVE",
    }

    status = status.upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Allowed values: "
                + ", ".join(sorted(allowed_statuses))
            ),
        )

    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    alert.status = status

    if status == "RESOLVED":
        alert.resolved_at = datetime.utcnow()
    else:
        alert.resolved_at = None

    db.commit()
    db.refresh(alert)

    return alert