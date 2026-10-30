from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid

class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    
    baseline_snapshot_id = Column(String(36), ForeignKey("digital_twin_snapshots.id", ondelete="SET NULL"), nullable=True)
    modified_parameters = Column(Text, nullable=False) # JSON: {"daily_study_hours": 3.5, "attendance": 88}
    baseline_prediction = Column(Text, nullable=False) # JSON: {"predicted_cgpa": 8.1, "risk_level": "Low"}
    simulated_prediction = Column(Text, nullable=False) # JSON: {"predicted_cgpa": 8.7, "risk_level": "Low"}
    impact_summary = Column(Text, nullable=False) # JSON: {"cgpa_difference": +0.6, "risk_difference": "Unchanged"}
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="simulation_scenarios")
    baseline_snapshot = relationship("DigitalTwinSnapshot")
