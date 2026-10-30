from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid

class DigitalTwinSnapshot(Base):
    __tablename__ = "digital_twin_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    academic_state = Column(Text, nullable=False) # JSON
    behavioral_state = Column(Text, nullable=False) # JSON
    skill_state = Column(Text, nullable=False) # JSON
    coding_state = Column(Text, nullable=False) # JSON
    derived_features = Column(Text, nullable=False) # JSON
    
    predicted_cgpa = Column(Float, nullable=True)
    academic_risk_level = Column(String(50), nullable=True) # Low, Moderate, High
    academic_risk_probability = Column(Float, nullable=True)
    model_version = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="digital_twin_snapshots")
