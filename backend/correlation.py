from sqlalchemy.orm import Session

from alerts import Alert


def calculate_correlated_risk(
    db: Session,
    source_ip: str,
):
    alerts = (
        db.query(Alert)
        .filter(
            Alert.source_ip == source_ip,
            Alert.status != "RESOLVED",
        )
        .order_by(Alert.detected_at.desc())
        .all()
    )

    if not alerts:
        return {
            "source_ip": source_ip,
            "alert_count": 0,
            "correlated_risk": 0,
            "severity": "NONE",
            "alert_types": [],
        }

    # Use the highest individual risk as the base.
    highest_risk = max(
        alert.risk_score for alert in alerts
    )

    # Add a small correlation increase when
    # multiple different alert types are present.
    unique_alert_types = {
        alert.alert_type
        for alert in alerts
    }

    correlation_bonus = min(
        (len(unique_alert_types) - 1) * 10,
        20,
    )

    correlated_risk = min(
        highest_risk + correlation_bonus,
        100,
    )

    if correlated_risk >= 80:
        severity = "HIGH"
    elif correlated_risk >= 50:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    return {
        "source_ip": source_ip,
        "alert_count": len(alerts),
        "correlated_risk": correlated_risk,
        "severity": severity,
        "alert_types": sorted(unique_alert_types),
    }