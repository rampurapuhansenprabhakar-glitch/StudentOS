from app.core.database import Base
from app.models.user import User, generate_uuid
from app.models.profile import StudentProfile
from app.models.academic import Subject, Assessment
from app.models.attendance import AttendanceRecord
from app.models.assignment import Assignment
from app.models.study import DailyStudyLog
from app.models.skill import StudentSkill
from app.models.coding import CodingLog, StudentGoal
from app.models.recommendation import Recommendation
from app.models.digital_twin import DigitalTwinSnapshot
from app.models.simulation import SimulationScenario
from app.models.study_plan import StudyPlan, StudyPlanSession

__all__ = [
    "Base",
    "generate_uuid",
    "User",
    "StudentProfile",
    "Subject",
    "Assessment",
    "AttendanceRecord",
    "Assignment",
    "DailyStudyLog",
    "StudentSkill",
    "CodingLog",
    "StudentGoal",
    "Recommendation",
    "DigitalTwinSnapshot",
    "SimulationScenario",
    "StudyPlan",
    "StudyPlanSession",
]
