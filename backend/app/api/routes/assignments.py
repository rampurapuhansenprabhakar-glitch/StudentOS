from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.academic import Subject
from app.models.assignment import Assignment
from app.schemas.assignment import (
    AssignmentCreate, AssignmentUpdate, AssignmentResponse,
    AssignmentWorkloadResponse, WorkloadDay
)
from app.api.dependencies import get_current_user
from app.services.digital_twin_service import DigitalTwinService

router = APIRouter(prefix="/assignments", tags=["Assignments & Deadlines"])

@router.get("", response_model=List[AssignmentResponse])
def get_assignments(
    status_filter: Optional[str] = None,
    subject_id: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Assignment).filter(Assignment.user_id == user.id)
    if status_filter:
        query = query.filter(Assignment.status == status_filter)
    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)

    assignments = query.order_by(Assignment.due_date.asc()).all()
    now = datetime.now(timezone.utc)
    results = []

    for a in assignments:
        is_overdue = (a.status != "completed") and (a.due_date.replace(tzinfo=timezone.utc) if a.due_date.tzinfo is None else a.due_date) < now
        results.append(
            AssignmentResponse(
                id=a.id,
                user_id=a.user_id,
                subject_id=a.subject_id,
                subject_name=a.subject.name if a.subject else None,
                title=a.title,
                description=a.description,
                due_date=a.due_date,
                estimated_duration_hours=a.estimated_duration_hours,
                actual_duration_hours=a.actual_duration_hours,
                priority=a.priority,
                status="overdue" if is_overdue else a.status,
                notes=a.notes,
                is_overdue=is_overdue,
                completed_at=a.completed_at,
                created_at=a.created_at,
                updated_at=a.updated_at
            )
        )
    return results

@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment_in: AssignmentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = Assignment(**assignment_in.model_dump(), user_id=user.id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return AssignmentResponse(
        id=assignment.id,
        user_id=assignment.user_id,
        subject_id=assignment.subject_id,
        subject_name=assignment.subject.name if assignment.subject else None,
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date,
        estimated_duration_hours=assignment.estimated_duration_hours,
        actual_duration_hours=assignment.actual_duration_hours,
        priority=assignment.priority,
        status=assignment.status,
        notes=assignment.notes,
        is_overdue=False,
        completed_at=assignment.completed_at,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at
    )

@router.patch("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: str,
    assignment_in: AssignmentUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    data = assignment_in.model_dump(exclude_unset=True)
    if "status" in data and data["status"] == "completed" and assignment.status != "completed":
        assignment.completed_at = datetime.now(timezone.utc)
    elif "status" in data and data["status"] != "completed":
        assignment.completed_at = None

    for field, val in data.items():
        setattr(assignment, field, val)

    db.commit()
    db.refresh(assignment)

    now = datetime.now(timezone.utc)
    is_overdue = (assignment.status != "completed") and (assignment.due_date.replace(tzinfo=timezone.utc) if assignment.due_date.tzinfo is None else assignment.due_date) < now

    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return AssignmentResponse(
        id=assignment.id,
        user_id=assignment.user_id,
        subject_id=assignment.subject_id,
        subject_name=assignment.subject.name if assignment.subject else None,
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date,
        estimated_duration_hours=assignment.estimated_duration_hours,
        actual_duration_hours=assignment.actual_duration_hours,
        priority=assignment.priority,
        status=assignment.status,
        notes=assignment.notes,
        is_overdue=is_overdue,
        completed_at=assignment.completed_at,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at
    )

@router.delete("/{assignment_id}", status_code=status.HTTP_200_OK)
def delete_assignment(
    assignment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return {"message": "Assignment deleted successfully"}

@router.get("/workload", response_model=AssignmentWorkloadResponse)
def get_workload_analysis(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    all_assignments = db.query(Assignment).filter(Assignment.user_id == user.id).all()
    now = datetime.now(timezone.utc)

    total_active = len([a for a in all_assignments if a.status in ["not_started", "in_progress"]])
    completed_count = len([a for a in all_assignments if a.status == "completed"])
    overdue_count = len([a for a in all_assignments if a.status != "completed" and (a.due_date.replace(tzinfo=timezone.utc) if a.due_date.tzinfo is None else a.due_date) < now])
    
    rate = round((completed_count / len(all_assignments) * 100.0) if all_assignments else 100.0, 1)

    # 7-day workload distribution
    days = []
    tot_7_days_hours = 0.0

    today = date.today()
    for i in range(7):
        target_d = today + timedelta(days=i)
        day_assignments = [
            a for a in all_assignments 
            if a.status != "completed" and a.due_date.date() == target_d
        ]
        day_hours = sum(a.estimated_duration_hours or 2.0 for a in day_assignments)
        tot_7_days_hours += day_hours

        days.append(
            WorkloadDay(
                date=target_d.isoformat(),
                day_name=target_d.strftime("%a"),
                assignments_count=len(day_assignments),
                estimated_hours=round(day_hours, 1),
                assignment_titles=[a.title for a in day_assignments]
            )
        )

    return AssignmentWorkloadResponse(
        total_active=total_active,
        completed_count=completed_count,
        overdue_count=overdue_count,
        completion_rate=rate,
        upcoming_7_days=days,
        total_estimated_hours_next_7_days=round(tot_7_days_hours, 1)
    )
