from datetime import date, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.academic import Subject, Assessment
from app.models.attendance import AttendanceRecord
from app.models.study import DailyStudyLog
from app.models.assignment import Assignment
from app.models.recommendation import Recommendation
from app.models.coding import CodingLog
from app.schemas.analytics import OverviewAnalyticsResponse, TrendPoint
from app.api.dependencies import get_current_user
from app.services.digital_twin_service import DigitalTwinService

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])

@router.get("/overview", response_model=OverviewAnalyticsResponse)
def get_dashboard_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    state = DigitalTwinService.compute_student_state(user, db)
    acad = state["academic_state"]
    behav = state["behavioral_state"]
    
    # Active recommendations count
    active_recs_count = db.query(Recommendation).filter(
        Recommendation.user_id == user.id,
        Recommendation.status == "active"
    ).count()

    # Total DSA solved
    coding_logs = db.query(CodingLog).filter(CodingLog.user_id == user.id).all()
    study_logs = db.query(DailyStudyLog).filter(DailyStudyLog.user_id == user.id).all()
    total_dsa = sum(l.dsa_problems_solved for l in study_logs) + len([c for c in coding_logs if c.status == "Solved"])

    # Trend lines: Study hours (last 7 days)
    today = date.today()
    study_trends: List[TrendPoint] = []
    log_lookup = {l.date: l.total_study_hours for l in study_logs}
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        study_trends.append(
            TrendPoint(
                label=d.strftime("%a"),
                value=log_lookup.get(d, 0.0)
            )
        )

    # Academic performance trend from assessments
    assessments = db.query(Assessment).filter(Assessment.user_id == user.id).order_by(Assessment.date.asc()).all()
    acad_trends: List[TrendPoint] = []
    for a in assessments[-6:]:
        pct = round((a.marks_obtained / a.max_marks) * 100.0, 1)
        acad_trends.append(
            TrendPoint(label=a.name[:10], value=pct)
        )
    if not acad_trends:
        acad_trends = [
            TrendPoint(label="Sem 4", value=round(acad["previous_cgpa"] * 9.5, 1)),
            TrendPoint(label="Sem 5", value=round(acad["current_cgpa"] * 9.5, 1)),
            TrendPoint(label="Predicted", value=round(state["predicted_cgpa"] * 9.5, 1) if state["predicted_cgpa"] else 80.0)
        ]

    # Attendance trend by subject
    subjects = db.query(Subject).filter(Subject.user_id == user.id, Subject.is_active == True).all()
    attendance_records = db.query(AttendanceRecord).filter(AttendanceRecord.user_id == user.id).all()
    att_trends: List[TrendPoint] = []
    subject_marks_comparison: List[Dict[str, Any]] = []

    for s in subjects[:6]:
        s_att = [r for r in attendance_records if r.subject_id == s.id]
        cond = sum(r.classes_conducted for r in s_att)
        attd = sum(r.classes_attended for r in s_att)
        pct = round((attd / cond * 100.0) if cond > 0 else 100.0, 1)
        att_trends.append(TrendPoint(label=s.name[:12], value=pct))

        s_asm = [a for a in assessments if a.subject_id == s.id]
        avg_score = round(sum((a.marks_obtained / a.max_marks) * 100.0 for a in s_asm) / len(s_asm), 1) if s_asm else 75.0
        subject_marks_comparison.append({
            "subject": s.name[:15],
            "score": avg_score,
            "target": 80.0
        })

    # Generate key concise insights backed by real data
    insights = []
    if behav["study_consistency_score"] >= 70.0:
        insights.append(f"Strong study consistency of {behav['study_consistency_score']}% maintained over the past 14 days.")
    else:
        insights.append(f"Study consistency is at {behav['study_consistency_score']}%. Adding short regular sessions will raise habit stability.")

    if acad["attendance_percentage"] < 75.0:
        insights.append(f"Overall attendance ({acad['attendance_percentage']}%) is below institutional benchmark (75%).")
    else:
        insights.append(f"Attendance compliance is on track at {acad['attendance_percentage']}%.")

    if state["predicted_cgpa"] and acad["target_cgpa"]:
        diff = round(state["predicted_cgpa"] - acad["target_cgpa"], 2)
        if diff >= 0:
            insights.append(f"Current projection ({state['predicted_cgpa']}) meets your target CGPA of {acad['target_cgpa']}.")
        else:
            insights.append(f"Projected CGPA ({state['predicted_cgpa']}) is {abs(diff)} points shy of target ({acad['target_cgpa']}). Explore What-If simulation.")

    if total_dsa >= 10:
        insights.append(f"Good problem-solving momentum with {total_dsa} DSA problems solved.")

    return OverviewAnalyticsResponse(
        current_cgpa=acad["current_cgpa"],
        target_cgpa=acad["target_cgpa"],
        predicted_cgpa=state["predicted_cgpa"],
        overall_attendance=acad["attendance_percentage"],
        assignment_completion_rate=behav["assignment_completion_rate"],
        average_daily_study_hours=behav["daily_study_hours"],
        study_consistency_score=behav["study_consistency_score"],
        total_dsa_solved=total_dsa,
        active_recommendations_count=active_recs_count,
        academic_risk_level=state["academic_risk_level"] or "Low",
        academic_performance_trend=acad_trends,
        attendance_trend=att_trends,
        study_hours_trend=study_trends,
        subject_marks_comparison=subject_marks_comparison,
        key_insights=insights
    )
