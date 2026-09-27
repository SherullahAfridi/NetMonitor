from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Text

from database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    alert_type = Column(
        String(100),
        nullable=False,
    )

    severity = Column(
        String(20),
        nullable=False,
    )

    risk_score = Column(
        Integer,
        nullable=False,
        default=0,
    )

    source_ip = Column(
        String(45),
        nullable=True,
    )

    destination_ip = Column(
        String(45),
        nullable=True,
    )

    protocol = Column(
        String(20),
        nullable=True,
    )

    description = Column(
        Text,
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="NEW",
    )

    detected_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    resolved_at = Column(
        DateTime,
        nullable=True,
    )