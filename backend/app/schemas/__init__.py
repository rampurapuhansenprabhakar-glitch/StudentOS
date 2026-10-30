from app.schemas.user import UserRegister, UserLogin, Token, TokenData, UserResponse
from app.schemas.profile import (
    StudentProfileBase, StudentProfileUpdate, OnboardingRequest, 
    OnboardingSubjectInput, StudentProfileResponse
)
from app.schemas.academic import (
    SubjectBase, SubjectCreate, SubjectUpdate, SubjectResponse,
    AssessmentBase, AssessmentCreate, AssessmentUpdate, AssessmentResponse,
    AcademicOverviewResponse, SubjectPerformanceSummary
)
from app.schemas.attendance import (
    AttendanceRecordBase, AttendanceRecordCreate, AttendanceRecordUpdate,
    AttendanceRecordResponse, SubjectAttendanceSummary, OverallAttendanceSummary,
    TargetAttendanceCalculationRequest, TargetAttendanceCalculationResponse
)
from app.schemas.assignment import (
    AssignmentBase, AssignmentCreate, AssignmentUpdate, AssignmentResponse,
    AssignmentWorkloadResponse, WorkloadDay
)
from app.schemas.study import (
    DailyStudyLogBase, DailyStudyLogCreate, DailyStudyLogUpdate, DailyStudyLogResponse,
    StudyAnalyticsResponse, SubjectStudyDuration, StudyDayTrend, SubjectTimeDistribution
)
from app.schemas.skill import (
    StudentSkillBase, StudentSkillCreate, StudentSkillUpdate, StudentSkillResponse,
    SkillGapItem, CareerRoleRequirement, SkillGapAnalysisResponse
)
from app.schemas.coding import (
    CodingLogBase, CodingLogCreate, CodingLogUpdate, CodingLogResponse,
    StudentGoalBase, StudentGoalCreate, StudentGoalUpdate, StudentGoalResponse,
    CodingAnalyticsResponse
)
from app.schemas.digital_twin import DigitalTwinResponse, SnapshotHistoryItem
from app.schemas.simulation import (
    SimulationParameters, SimulationRunRequest, PredictionOutcome,
    SimulationImpact, SimulationResult, SimulationSaveRequest, SimulationScenarioResponse
)
from app.schemas.recommendation import RecommendationBase, RecommendationResponse, RecommendationActionRequest
from app.schemas.study_plan import (
    StudyPlanCreate, StudyPlanResponse, StudyPlanSessionCreate, StudyPlanSessionResponse
)
from app.schemas.analytics import OverviewAnalyticsResponse, TrendPoint
from app.schemas.assistant import ChatMessage, AssistantChatRequest, AssistantChatResponse
