from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)

    ip = Column(String, unique=True, index=True, nullable=False)
    mac = Column(String, nullable=True)
    hostname = Column(String, nullable=True)
    vendor = Column(String, nullable=True)

    status = Column(String, default="online")
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )