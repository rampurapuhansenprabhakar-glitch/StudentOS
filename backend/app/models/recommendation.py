from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    title = Column(String(200), nullable=False)
    reason = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)
    priority = Column(String(20), default="medium", nullable=False) # high, medium, low
    suggested_action = Column(Text, nullable=False)
    expected_effort_hours = Column(Float, nullable=True)
    related_weakness = Column(String(100), nullable=True)
    category = Column(String(50), default="academic", nullable=False) # academic, attendance, study, skills, coding
    status = Column(String(20), default="active", nullable=False) # active, accepted, dismissed, completed
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="recommendations")
