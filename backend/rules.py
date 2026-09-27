from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from database import Base


class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    rule_name = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    rule_type = Column(
        String(100),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=False,
    )

    enabled = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    threshold = Column(
        Integer,
        nullable=False,
        default=5,
    )

    window_seconds = Column(
        Integer,
        nullable=False,
        default=60,
    )

    severity = Column(
        String(20),
        nullable=False,
    )

    risk_score = Column(
        Integer,
        nullable=False,
        default=50,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )