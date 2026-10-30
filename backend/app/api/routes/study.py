import json
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.study import DailyStudyLog
from app.schemas.study import (
    DailyStudyLogCreate, DailyStudyLogUpdate, DailyStudyLogResponse,
    StudyAnalyticsResponse, SubjectStudyDuration, StudyDayTrend, SubjectTimeDistribution
)
from app.api.dependencies import get_current_user
from app.services.digital_twin_service import DigitalTwinService

router = APIRouter(prefix="/study", tags=["Daily Study Tracker"])

@router.get("/logs", response_model=List[DailyStudyLogResponse])
def get_study_logs(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DailyStudyLog).filter(DailyStudyLog.user_id == user.id)
    if start_date:
        query = query.filter(DailyStudyLog.date >= start_date)
    if end_date:
        query = query.filter(DailyStudyLog.date <= end_date)

    logs = query.order_by(DailyStudyLog.date.desc()).all()
    results = []
    for l in logs:
        subj_durations = []
        if l.subject_breakdown:
            try:
                raw_list = json.loads(l.subject_breakdown)
                subj_durations = [SubjectStudyDuration(**item) for item in raw_list]
            except Exception:
                subj_durations = []

        results.append(
            DailyStudyLogResponse(
                id=l.id,
                user_id=l.user_id,
                date=l.date,
                total_study_hours=l.total_study_hours,
                sessions_count=l.sessions_count,
                revision_completed=l.revision_completed,
                assignment_work_completed=l.assignment_work_completed,
                dsa_problems_attempted=l.dsa_problems_attempted,
                dsa_problems_solved=l.dsa_problems_solved,
                coding_practice_hours=l.coding_practice_hours,
                focus_rating=l.focus_rating,
                difficulty_rating=l.difficulty_rating,
                notes=l.notes,
                subject_durations=subj_durations,
                created_at=l.created_at,
                updated_at=l.updated_at
            )
        )
    return results

@router.post("/logs", response_model=DailyStudyLogResponse, status_code=status.HTTP_201_CREATED)
def create_study_log(
    log_in: DailyStudyLogCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check duplicate submission for the same date
    existing = db.query(DailyStudyLog).filter(
        DailyStudyLog.user_id == user.id,
        DailyStudyLog.date == log_in.date
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A study log for {log_in.date} already exists. Please edit the existing entry."
        )

    breakdown_json = None
    if log_in.subject_durations:
        breakdown_json = json.dumps([s.model_dump() for s in log_in.subject_durations])

    log_dict = log_in.model_dump(exclude={"subject_durations"})
    study_log = DailyStudyLog(
        **log_dict,
        user_id=user.id,
        subject_breakdown=breakdown_json
    )
    db.add(study_log)
    db.commit()
    db.refresh(study_log)

    DigitalTwinService.sync_digital_twin_snapshot(user, db)

    return DailyStudyLogResponse(
        id=study_log.id,
        user_id=study_log.user_id,
        date=study_log.date,
        total_study_hours=study_log.total_study_hours,
        sessions_count=study_log.sessions_count,
        revision_completed=study_log.revision_completed,
        assignment_work_completed=study_log.assignment_work_completed,
        dsa_problems_attempted=study_log.dsa_problems_attempted,
        dsa_problems_solved=study_log.dsa_problems_solved,
        coding_practice_hours=study_log.coding_practice_hours,
        focus_rating=study_log.focus_rating,
        difficulty_rating=study_log.difficulty_rating,
        notes=study_log.notes,
        subject_durations=log_in.subject_durations or [],
        created_at=study_log.created_at,
        updated_at=study_log.updated_at
    )

@router.delete("/logs/{log_id}", status_code=status.HTTP_200_OK)
def delete_study_log(
    log_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log = db.query(DailyStudyLog).filter(DailyStudyLog.id == log_id, DailyStudyLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Study log not found")

    db.delete(log)
    db.commit()
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return {"message": "Study log deleted successfully"}

@router.get("/analytics", response_model=StudyAnalyticsResponse)
def get_study_analytics(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cutoff = date.today() - timedelta(days=30)
    logs = db.query(DailyStudyLog).filter(
        DailyStudyLog.user_id == user.id,
        DailyStudyLog.date >= cutoff
    ).order_by(DailyStudyLog.date.asc()).all()

    total_days = len(logs)
    if total_days == 0:
        return StudyAnalyticsResponse(
            total_days_logged=0,
            average_daily_hours=0.0,
            average_weekly_hours=0.0,
            study_consistency_score=0.0,
            average_focus_rating=0.0,
            total_dsa_attempted=0,
            total_dsa_solved=0,
            total_coding_hours=0.0,
            subject_distribution=[],
            daily_trends=[],
            week_over_week_change=0.0
        )

    tot_hours = sum(l.total_study_hours for l in logs)
    avg_daily = round(tot_hours / 30.0, 2)
    avg_weekly = round(avg_daily * 7.0, 2)
    consistency = round((total_days / 30.0) * 100.0, 1)
    avg_focus = round(sum(l.focus_rating for l in logs) / total_days, 2)
    tot_dsa_att = sum(l.dsa_problems_attempted for l in logs)
    tot_dsa_sol = sum(l.dsa_problems_solved for l in logs)
    tot_coding = round(sum(l.coding_practice_hours for l in logs), 1)

    # Subject distribution aggregation
    subject_hours_map = {}
    for l in logs:
        if l.subject_breakdown:
            try:
                breakdowns = json.loads(l.subject_breakdown)
                for item in breakdowns:
                    name = item.get("subject_name", "General")
                    h = float(item.get("duration_hours", 0.0))
                    subject_hours_map[name] = subject_hours_map.get(name, 0.0) + h
            except Exception:
                pass

    total_sub_hours = sum(subject_hours_map.values()) or 1.0
    subject_dist = [
        SubjectTimeDistribution(
            subject_name=s_name,
            total_hours=round(s_hours, 1),
            percentage=round((s_hours / total_sub_hours) * 100.0, 1)
        )
        for s_name, s_hours in sorted(subject_hours_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # Daily trends (last 14 days)
    daily_trends = []
    log_map = {l.date: l for l in logs}
    today = date.today()

    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        l = log_map.get(d)
        daily_trends.append(
            StudyDayTrend(
                date=d.isoformat(),
                day_name=d.strftime("%a"),
                study_hours=l.total_study_hours if l else 0.0,
                coding_hours=l.coding_practice_hours if l else 0.0,
                focus_rating=l.focus_rating if l else 0,
                has_record=l is not None
            )
        )

    # Week-over-week change
    this_week_logs = [l for l in logs if l.date >= today - timedelta(days=7)]
    prev_week_logs = [l for l in logs if today - timedelta(days=14) <= l.date < today - timedelta(days=7)]
    this_week_h = sum(l.total_study_hours for l in this_week_logs)
    prev_week_h = sum(l.total_study_hours for l in prev_week_logs)

    if prev_week_h > 0:
        wow_change = round(((this_week_h - prev_week_h) / prev_week_h) * 100.0, 1)
    else:
        wow_change = 0.0

    return StudyAnalyticsResponse(
        total_days_logged=total_days,
        average_daily_hours=avg_daily,
        average_weekly_hours=avg_weekly,
        study_consistency_score=consistency,
        average_focus_rating=avg_focus,
        total_dsa_attempted=tot_dsa_att,
        total_dsa_solved=tot_dsa_sol,
        total_coding_hours=tot_coding,
        subject_distribution=subject_dist,
        daily_trends=daily_trends,
        week_over_week_change=wow_change
    )
