from datetime import datetime, date, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid

class CodingLog(Base):
    __tablename__ = "coding_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    date = Column(Date, default=date.today, nullable=False)
    problem_title = Column(String(200), nullable=False)
    platform = Column(String(50), default="LeetCode", nullable=False)
    language = Column(String(50), default="Python", nullable=False)
    topic = Column(String(50), default="Arrays", nullable=False)
    difficulty = Column(String(20), default="Medium", nullable=False) # Easy, Medium, Hard
    status = Column(String(20), default="Solved", nullable=False) # Solved, Attempted, Review Needed
    time_spent_minutes = Column(Integer, default=30, nullable=False)
    confidence_rating = Column(Integer, default=3, nullable=False) # 1 - 5
    problem_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="coding_logs")

class StudentGoal(Base):
    __tablename__ = "student_goals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    title = Column(String(200), nullable=False)
    goal_type = Column(String(50), default="cgpa", nullable=False) # cgpa, study_hours, dsa_count, skill_target, career
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0, nullable=False)
    unit = Column(String(50), default="", nullable=False)
    deadline = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="goals")
