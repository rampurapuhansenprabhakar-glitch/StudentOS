from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    
    display_name = Column(String(100), nullable=False)
    institution = Column(String(200), nullable=True)
    degree = Column(String(100), nullable=True, default="B.Tech")
    branch = Column(String(100), nullable=True, default="Computer Science & Engineering (AIML)")
    current_year = Column(Integer, nullable=True, default=3)
    current_semester = Column(Integer, nullable=True, default=6)
    expected_graduation_year = Column(Integer, nullable=True, default=2027)
    
    current_cgpa = Column(Float, nullable=True)
    previous_semester_cgpa = Column(Float, nullable=True)
    target_cgpa = Column(Float, nullable=True, default=9.0)
    preferred_study_hours_per_day = Column(Float, nullable=True, default=3.0)
    
    primary_career_goal = Column(String(100), nullable=True, default="AI/ML Engineer")
    preferred_programming_language = Column(String(50), nullable=True, default="Python")
    technical_skill_level = Column(String(50), nullable=True, default="Intermediate")
    
    weak_subjects = Column(Text, nullable=True)   # JSON string
    strong_subjects = Column(Text, nullable=True) # JSON string
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="profile")
