from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from rules import DetectionRule


router = APIRouter(
    prefix="/api/rules",
    tags=["Detection Rules"],
)


DEFAULT_RULES = [
    {
        "rule_name": "Possible Port Scan",
        "rule_type": "POSSIBLE_PORT_SCAN",
        "description": (
            "Detects a source contacting multiple destination "
            "ports within a short time window."
        ),
        "enabled": True,
        "threshold": 5,
        "window_seconds": 60,
        "severity": "HIGH",
        "risk_score": 85,
    },
    {
        "rule_name": "Repeated Connection Attempts",
        "rule_type": "REPEATED_CONNECTION_ATTEMPTS",
        "description": (
            "Detects repeated TCP connection attempts from the "
            "same source to the same destination."
        ),
        "enabled": True,
        "threshold": 5,
        "window_seconds": 60,
        "severity": "MEDIUM",
        "risk_score": 55,
    },
    {
        "rule_name": "Possible Host Sweep",
        "rule_type": "POSSIBLE_HOST_SWEEP",
        "description": (
            "Detects a source contacting multiple destination "
            "hosts within a short time window."
        ),
        "enabled": True,
        "threshold": 3,
        "window_seconds": 60,
        "severity": "HIGH",
        "risk_score": 75,
    },
    {
        "rule_name": "High Connection Rate",
        "rule_type": "HIGH_CONNECTION_RATE",
        "description": (
            "Detects an unusually high number of connection "
            "attempts from a single source."
        ),
        "enabled": True,
        "threshold": 20,
        "window_seconds": 60,
        "severity": "HIGH",
        "risk_score": 80,
    },
    {
        "rule_name": "Unknown Device",
        "rule_type": "UNKNOWN_DEVICE",
        "description": (
            "Detects network activity from a device that is "
            "not currently present in the known asset inventory."
        ),
        "enabled": True,
        "threshold": 1,
        "window_seconds": 60,
        "severity": "MEDIUM",
        "risk_score": 60,
    },
]


def initialize_default_rules(db: Session):
    for rule_data in DEFAULT_RULES:
        existing_rule = (
            db.query(DetectionRule)
            .filter(
                DetectionRule.rule_type
                == rule_data["rule_type"]
            )
            .first()
        )

        if not existing_rule:
            db.add(DetectionRule(**rule_data))

    db.commit()


@router.get("/")
def get_rules(db: Session = Depends(get_db)):
    initialize_default_rules(db)

    return (
        db.query(DetectionRule)
        .order_by(DetectionRule.id.asc())
        .all()
    )


@router.get("/{rule_id}")
def get_rule(
    rule_id: int,
    db: Session = Depends(get_db),
):
    initialize_default_rules(db)

    rule = (
        db.query(DetectionRule)
        .filter(DetectionRule.id == rule_id)
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Detection rule not found",
        )

    return rule


@router.patch("/{rule_id}/toggle")
def toggle_rule(
    rule_id: int,
    db: Session = Depends(get_db),
):
    initialize_default_rules(db)

    rule = (
        db.query(DetectionRule)
        .filter(DetectionRule.id == rule_id)
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Detection rule not found",
        )

    rule.enabled = not rule.enabled

    db.commit()
    db.refresh(rule)

    return {
        "status": "success",
        "message": (
            f"Detection rule {'enabled' if rule.enabled else 'disabled'}."
        ),
        "rule": rule,
    }