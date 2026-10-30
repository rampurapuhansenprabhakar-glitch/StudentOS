from datetime import datetime, date, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=True)
    credits = Column(Integer, default=3, nullable=False)
    semester = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    target_attendance = Column(Float, default=75.0, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="subjects")
    assessments = relationship("Assessment", back_populates="subject", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="subject", cascade="all, delete-orphan")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False)
    
    name = Column(String(150), nullable=False)
    assessment_type = Column(String(50), default="internal", nullable=False) # internal, midterm, quiz, lab, assignment, semester_exam
    date = Column(Date, default=date.today, nullable=False)
    marks_obtained = Column(Float, nullable=False)
    max_marks = Column(Float, nullable=False)
    weightage = Column(Float, nullable=True) # e.g. 20%
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="assessments")
    subject = relationship("Subject", back_populates="assessments")
