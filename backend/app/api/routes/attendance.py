import math
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.academic import Subject
from app.models.attendance import AttendanceRecord
from app.schemas.attendance import (
    AttendanceRecordCreate, AttendanceRecordUpdate, AttendanceRecordResponse,
    OverallAttendanceSummary, SubjectAttendanceSummary,
    TargetAttendanceCalculationRequest, TargetAttendanceCalculationResponse
)
from app.api.dependencies import get_current_user
from app.services.digital_twin_service import DigitalTwinService

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

@router.get("", response_model=OverallAttendanceSummary)
def get_attendance_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subjects = db.query(Subject).filter(Subject.user_id == user.id, Subject.is_active == True).all()
    records = db.query(AttendanceRecord).filter(AttendanceRecord.user_id == user.id).all()

    subject_summaries = []
    total_conducted = 0
    total_attended = 0
    below_thresh_count = 0

    for s in subjects:
        subj_recs = [r for r in records if r.subject_id == s.id]
        s_conducted = sum(r.classes_conducted for r in subj_recs)
        s_attended = sum(r.classes_attended for r in subj_recs)
        s_missed = max(0, s_conducted - s_attended)

        pct = round((s_attended / s_conducted * 100.0) if s_conducted > 0 else 100.0, 2)
        target = s.target_attendance

        # Calculation of consecutive classes needed or can be missed
        T = target / 100.0
        consecutive_needed = 0
        can_miss = 0

        if pct < target and s_conducted > 0:
            below_thresh_count += 1
            if T < 1.0:
                consecutive_needed = max(1, math.ceil(round((T * s_conducted - s_attended) / (1.0 - T), 6)))
            else:
                consecutive_needed = 999 # impossible if target is 100% and missed any
            status_str = "Critical Warning"
        else:
            if T > 0:
                can_miss = max(0, math.floor(round((s_attended - T * s_conducted) / T, 6)))
            status_str = "Above Target" if pct > target + 5 else "On Track"

        total_conducted += s_conducted
        total_attended += s_attended

        subject_summaries.append(
            SubjectAttendanceSummary(
                subject_id=s.id,
                subject_name=s.name,
                subject_code=s.code,
                total_conducted=s_conducted,
                total_attended=s_attended,
                total_missed=s_missed,
                percentage=pct,
                target_percentage=target,
                status=status_str,
                consecutive_classes_needed=consecutive_needed,
                can_miss_classes=can_miss
            )
        )

    overall_pct = round((total_attended / total_conducted * 100.0) if total_conducted > 0 else 100.0, 2)

    return OverallAttendanceSummary(
        overall_percentage=overall_pct,
        total_conducted=total_conducted,
        total_attended=total_attended,
        total_missed=max(0, total_conducted - total_attended),
        subjects_count=len(subjects),
        subjects_below_threshold=below_thresh_count,
        subjects=subject_summaries
    )

@router.get("/records", response_model=List[AttendanceRecordResponse])
def get_attendance_records(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(AttendanceRecord).filter(AttendanceRecord.user_id == user.id).order_by(AttendanceRecord.date.desc()).all()
    resp = []
    for r in records:
        resp.append(
            AttendanceRecordResponse(
                id=r.id,
                user_id=r.user_id,
                subject_id=r.subject_id,
                subject_name=r.subject.name if r.subject else None,
                classes_conducted=r.classes_conducted,
                classes_attended=r.classes_attended,
                date=r.date,
                notes=r.notes,
                percentage=r.percentage,
                created_at=r.created_at,
                updated_at=r.updated_at
            )
        )
    return resp

@router.post("", response_model=AttendanceRecordResponse, status_code=status.HTTP_201_CREATED)
def record_attendance(
    att_in: AttendanceRecordCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify subject belongs to user
    subj = db.query(Subject).filter(Subject.id == att_in.subject_id, Subject.user_id == user.id).first()
    if not subj:
        raise HTTPException(status_code=400, detail="Subject does not belong to user.")

    if att_in.classes_attended > att_in.classes_conducted:
        raise HTTPException(status_code=400, detail="Classes attended cannot exceed classes conducted.")

    record = AttendanceRecord(**att_in.model_dump(), user_id=user.id)
    db.add(record)
    db.commit()
    db.refresh(record)

    DigitalTwinService.sync_digital_twin_snapshot(user, db)

    return AttendanceRecordResponse(
        id=record.id,
        user_id=record.user_id,
        subject_id=record.subject_id,
        subject_name=subj.name,
        classes_conducted=record.classes_conducted,
        classes_attended=record.classes_attended,
        date=record.date,
        notes=record.notes,
        percentage=record.percentage,
        created_at=record.created_at,
        updated_at=record.updated_at
    )

@router.delete("/{record_id}", status_code=status.HTTP_200_OK)
def delete_attendance_record(
    record_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id, AttendanceRecord.user_id == user.id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    db.delete(rec)
    db.commit()
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return {"message": "Attendance record deleted successfully"}

@router.post("/calculate", response_model=TargetAttendanceCalculationResponse)
def calculate_target_attendance(req: TargetAttendanceCalculationRequest):
    """
    Mathematical Attendance Calculator:
    Answers: 'How many consecutive classes must I attend to reach my target attendance?'
    or 'How many classes can I miss while remaining safely above target?'
    """
    if req.classes_attended > req.classes_conducted:
        raise HTTPException(status_code=400, detail="Attended cannot exceed conducted.")

    conducted = req.classes_conducted
    attended = req.classes_attended
    target_pct = req.target_percentage
    T = target_pct / 100.0

    curr_pct = round((attended / conducted * 100.0) if conducted > 0 else 100.0, 2)
    is_met = curr_pct >= target_pct

    consecutive_needed = 0
    can_miss = 0
    is_achievable = True

    if not is_met:
        if T >= 1.0:
            is_achievable = False
            consecutive_needed = 999
            explanation = "A target of 100% attendance is impossible to achieve once any class has been missed."
        else:
            consecutive_needed = math.ceil(round((T * conducted - attended) / (1.0 - T), 6))
            if req.total_planned_classes is not None:
                remaining_classes = req.total_planned_classes - conducted
                if consecutive_needed > remaining_classes:
                    is_achievable = False
                    explanation = (
                        f"Target of {target_pct}% is mathematically unachievable this semester. "
                        f"You need {consecutive_needed} classes, but only {remaining_classes} remaining."
                    )
                else:
                    explanation = f"You need to attend the next {consecutive_needed} consecutive classes without missing."
            else:
                explanation = f"You must attend the next {consecutive_needed} consecutive classes to reach {target_pct}%."
    else:
        if T > 0:
            can_miss = math.floor(round((attended - T * conducted) / T, 6))
        explanation = f"You are currently {curr_pct - target_pct:.1f}% above your target. You can safely miss up to {can_miss} class(es)."

    return TargetAttendanceCalculationResponse(
        current_percentage=curr_pct,
        target_percentage=target_pct,
        is_target_met=is_met,
        consecutive_classes_needed=consecutive_needed,
        can_miss_classes=can_miss,
        is_target_achievable=is_achievable,
        explanation=explanation
    )
