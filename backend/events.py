from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from database import Base


class NetworkEvent(Base):
    __tablename__ = "network_events"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    source_ip = Column(
        String(45),
        nullable=True,
    )

    destination_ip = Column(
        String(45),
        nullable=True,
    )

    source_port = Column(
        Integer,
        nullable=True,
    )

    destination_port = Column(
        Integer,
        nullable=True,
    )

    protocol = Column(
        String(20),
        nullable=True,
    )

    event_type = Column(
        String(100),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    timestamp = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )