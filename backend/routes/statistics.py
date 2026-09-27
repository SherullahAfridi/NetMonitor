from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from events import NetworkEvent
from alerts import Alert


router = APIRouter(
    prefix="/api/statistics",
    tags=["Statistics"],
)


@router.get("/")
def get_statistics(
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Total counts
    # --------------------------------------------------------

    total_events = (
        db.query(func.count(NetworkEvent.id))
        .scalar()
        or 0
    )

    total_alerts = (
        db.query(func.count(Alert.id))
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # Alert status counts
    # --------------------------------------------------------

    new_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.status == "NEW")
        .scalar()
        or 0
    )

    investigating_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.status == "INVESTIGATING")
        .scalar()
        or 0
    )

    resolved_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.status == "RESOLVED")
        .scalar()
        or 0
    )

    false_positive_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.status == "FALSE_POSITIVE")
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # Severity counts
    # --------------------------------------------------------

    high_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.severity == "HIGH")
        .scalar()
        or 0
    )

    medium_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.severity == "MEDIUM")
        .scalar()
        or 0
    )

    low_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.severity == "LOW")
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # Alerts grouped by type
    # --------------------------------------------------------

    alerts_by_type_query = (
        db.query(
            Alert.alert_type,
            func.count(Alert.id),
        )
        .group_by(Alert.alert_type)
        .all()
    )

    alerts_by_type = {
        alert_type: count
        for alert_type, count in alerts_by_type_query
    }

    # --------------------------------------------------------
    # Events grouped by type
    # --------------------------------------------------------

    events_by_type_query = (
        db.query(
            NetworkEvent.event_type,
            func.count(NetworkEvent.id),
        )
        .group_by(NetworkEvent.event_type)
        .all()
    )

    events_by_type = {
        event_type: count
        for event_type, count in events_by_type_query
    }

    # --------------------------------------------------------
    # Average risk score
    # --------------------------------------------------------

    average_risk = (
        db.query(func.avg(Alert.risk_score))
        .scalar()
    )

    if average_risk is None:
        average_risk = 0

    average_risk = round(
        float(average_risk),
        2,
    )

    # --------------------------------------------------------
    # Return statistics
    # --------------------------------------------------------

    return {
        "total_events": total_events,
        "total_alerts": total_alerts,

        "alerts": {
            "new": new_alerts,
            "investigating": investigating_alerts,
            "resolved": resolved_alerts,
            "false_positive": false_positive_alerts,
        },

        "severity": {
            "high": high_alerts,
            "medium": medium_alerts,
            "low": low_alerts,
        },

        "alerts_by_type": alerts_by_type,

        "events_by_type": events_by_type,

        "average_risk_score": average_risk,
    }