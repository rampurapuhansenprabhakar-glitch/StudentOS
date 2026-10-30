from datetime import datetime, date, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(200), nullable=False)
    start_date = Column(Date, default=date.today, nullable=False)
    end_date = Column(Date, nullable=False)
    total_planned_hours = Column(Float, default=0.0, nullable=False)
    status = Column(String(20), default="active", nullable=False) # active, completed, archived
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="study_plans")
    sessions = relationship("StudyPlanSession", back_populates="plan", cascade="all, delete-orphan")

class StudyPlanSession(Base):
    __tablename__ = "study_plan_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_id = Column(String(36), ForeignKey("study_plans.id", ondelete="CASCADE"), index=True, nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    subject_name = Column(String(150), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=True) # e.g. "17:00"
    duration_hours = Column(Float, nullable=False, default=1.5)
    topic = Column(String(200), nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    plan = relationship("StudyPlan", back_populates="sessions")
    subject = relationship("Subject")
