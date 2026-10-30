from datetime import datetime, date, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Date, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid

class DailyStudyLog(Base):
    __tablename__ = "daily_study_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    
    total_study_hours = Column(Float, nullable=False, default=0.0)
    sessions_count = Column(Integer, nullable=False, default=1)
    revision_completed = Column(Boolean, nullable=False, default=False)
    assignment_work_completed = Column(Boolean, nullable=False, default=False)
    
    dsa_problems_attempted = Column(Integer, nullable=False, default=0)
    dsa_problems_solved = Column(Integer, nullable=False, default=0)
    coding_practice_hours = Column(Float, nullable=False, default=0.0)
    
    focus_rating = Column(Integer, nullable=False, default=3) # 1 to 5
    difficulty_rating = Column(Integer, nullable=False, default=3) # 1 to 5
    
    notes = Column(Text, nullable=True)
    subject_breakdown = Column(Text, nullable=True) # JSON string: [{"subject_name": "ML", "hours": 2.0}]
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uq_user_study_date'),
    )

    user = relationship("User", back_populates="study_logs")
