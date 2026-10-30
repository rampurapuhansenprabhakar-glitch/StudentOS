from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.academic import Subject, Assessment
from app.models.attendance import AttendanceRecord
from app.schemas.academic import (
    SubjectCreate, SubjectUpdate, SubjectResponse,
    AssessmentCreate, AssessmentUpdate, AssessmentResponse,
    AcademicOverviewResponse, SubjectPerformanceSummary
)
from app.api.dependencies import get_current_user
from app.services.digital_twin_service import DigitalTwinService

router = APIRouter(prefix="/academic", tags=["Academic Performance"])

@router.get("/overview", response_model=AcademicOverviewResponse)
def get_academic_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subjects = db.query(Subject).filter(Subject.user_id == user.id, Subject.is_active == True).all()
    assessments = db.query(Assessment).filter(Assessment.user_id == user.id).all()
    attendance_records = db.query(AttendanceRecord).filter(AttendanceRecord.user_id == user.id).all()

    subject_summaries: List[SubjectPerformanceSummary] = []
    strong_subjects = []
    weak_subjects = []
    total_pct_sum = 0.0

    for s in subjects:
        subj_assessments = [a for a in assessments if a.subject_id == s.id]
        if subj_assessments:
            avg_pct = sum((a.marks_obtained / a.max_marks) * 100 for a in subj_assessments) / len(subj_assessments)
        else:
            avg_pct = 75.0 # neutral default if no assessments yet

        subj_att = [att for att in attendance_records if att.subject_id == s.id]
        cond = sum(a.classes_conducted for a in subj_att)
        attd = sum(a.classes_attended for a in subj_att)
        att_pct = (attd / cond * 100.0) if cond > 0 else 100.0

        if avg_pct >= 80.0:
            status_label = "Strong"
            strong_subjects.append(s.name)
        elif avg_pct < 60.0:
            status_label = "Needs Attention"
            weak_subjects.append(s.name)
        else:
            status_label = "Moderate"

        total_pct_sum += avg_pct
        subject_summaries.append(
            SubjectPerformanceSummary(
                subject_id=s.id,
                subject_name=s.name,
                subject_code=s.code,
                credits=s.credits,
                average_percentage=round(avg_pct, 2),
                assessments_count=len(subj_assessments),
                attendance_percentage=round(att_pct, 2),
                status=status_label
            )
        )

    overall_avg = round(total_pct_sum / len(subjects), 2) if subjects else 0.0
    profile = user.profile

    return AcademicOverviewResponse(
        current_cgpa=profile.current_cgpa if profile else None,
        target_cgpa=profile.target_cgpa if profile else None,
        overall_marks_average=overall_avg,
        total_subjects=len(subjects),
        total_assessments=len(assessments),
        subject_summaries=subject_summaries,
        strong_subjects=strong_subjects,
        weak_subjects=weak_subjects
    )

@router.get("/subjects", response_model=List[SubjectResponse])
def get_subjects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Subject).filter(Subject.user_id == user.id).all()

@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subj_in: SubjectCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = Subject(**subj_in.model_dump(), user_id=user.id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return subject

@router.patch("/subjects/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: str,
    subj_in: SubjectUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    for field, val in subj_in.model_dump(exclude_unset=True).items():
        setattr(subject, field, val)

    db.commit()
    db.refresh(subject)
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return subject

@router.delete("/subjects/{subject_id}", status_code=status.HTTP_200_OK)
def delete_subject(
    subject_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    db.delete(subject)
    db.commit()
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return {"message": "Subject deleted successfully"}

@router.get("/assessments", response_model=List[AssessmentResponse])
def get_assessments(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assessments = db.query(Assessment).filter(Assessment.user_id == user.id).order_by(Assessment.date.desc()).all()
    results = []
    for a in assessments:
        pct = round((a.marks_obtained / a.max_marks) * 100.0, 2)
        resp_item = AssessmentResponse(
            id=a.id,
            user_id=a.user_id,
            subject_id=a.subject_id,
            name=a.name,
            assessment_type=a.assessment_type,
            date=a.date,
            marks_obtained=a.marks_obtained,
            max_marks=a.max_marks,
            weightage=a.weightage,
            notes=a.notes,
            percentage=pct,
            created_at=a.created_at,
            updated_at=a.updated_at
        )
        results.append(resp_item)
    return results

@router.post("/assessments", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    assessment_in: AssessmentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify subject belongs to user
    subj = db.query(Subject).filter(Subject.id == assessment_in.subject_id, Subject.user_id == user.id).first()
    if not subj:
        raise HTTPException(status_code=400, detail="Subject does not exist or does not belong to user.")

    if assessment_in.marks_obtained > assessment_in.max_marks:
        raise HTTPException(status_code=400, detail="Marks obtained cannot exceed maximum marks.")

    assessment = Assessment(**assessment_in.model_dump(), user_id=user.id)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    pct = round((assessment.marks_obtained / assessment.max_marks) * 100.0, 2)
    DigitalTwinService.sync_digital_twin_snapshot(user, db)

    return AssessmentResponse(
        id=assessment.id,
        user_id=assessment.user_id,
        subject_id=assessment.subject_id,
        name=assessment.name,
        assessment_type=assessment.assessment_type,
        date=assessment.date,
        marks_obtained=assessment.marks_obtained,
        max_marks=assessment.max_marks,
        weightage=assessment.weightage,
        notes=assessment.notes,
        percentage=pct,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at
    )

@router.delete("/assessments/{assessment_id}", status_code=status.HTTP_200_OK)
def delete_assessment(
    assessment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.user_id == user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    db.delete(assessment)
    db.commit()
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return {"message": "Assessment deleted successfully"}
