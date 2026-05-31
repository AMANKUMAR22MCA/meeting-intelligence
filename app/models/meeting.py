from app.core.database import Base
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from sqlalchemy.sql import func


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    action_items = Column(JSON, nullable=True)
    sentiment = Column(String, nullable=True)
    processing_time = Column(Float, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, server_default=func.now(), index=True)