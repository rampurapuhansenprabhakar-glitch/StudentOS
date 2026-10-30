from datetime import datetime, date, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False)
    
    classes_conducted = Column(Integer, default=0, nullable=False)
    classes_attended = Column(Integer, default=0, nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")

    @property
    def percentage(self) -> float:
        if self.classes_conducted == 0:
            return 100.0
        return round((self.classes_attended / self.classes_conducted) * 100.0, 2)
