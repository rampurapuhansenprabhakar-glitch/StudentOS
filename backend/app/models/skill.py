from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid

class StudentSkill(Base):
    __tablename__ = "student_skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    name = Column(String(100), nullable=False)
    category = Column(String(100), default="Core CS", nullable=False) # Programming, DSA, Databases, Web, ML, Cloud
    current_proficiency = Column(Float, default=0.0, nullable=False) # 0 - 100
    target_proficiency = Column(Float, default=80.0, nullable=False) # 0 - 100
    notes = Column(Text, nullable=True)
    last_assessed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="skills")

    @property
    def skill_gap(self) -> float:
        return max(0.0, round(self.target_proficiency - self.current_proficiency, 2))
