from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.profile import StudentProfile
from app.models.academic import Subject
from app.models.attendance import AttendanceRecord
from app.models.skill import StudentSkill
from app.schemas.profile import (
    StudentProfileResponse, StudentProfileUpdate, OnboardingRequest
)
from app.api.dependencies import get_current_user
from app.services.digital_twin_service import DigitalTwinService

router = APIRouter(prefix="/profile", tags=["Student Profile"])

@router.get("", response_model=StudentProfileResponse)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.profile:
        profile = StudentProfile(user_id=user.id, display_name="Student")
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
    return user.profile

@router.patch("", response_model=StudentProfileResponse)
def update_profile(
    profile_in: StudentProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = user.profile
    if not profile:
        profile = StudentProfile(user_id=user.id, display_name="Student")
        db.add(profile)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    # Sync digital twin after profile modification
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return profile

@router.post("/onboarding", response_model=StudentProfileResponse)
def complete_onboarding(
    onboarding: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = user.profile
    if not profile:
        profile = StudentProfile(user_id=user.id, display_name=onboarding.display_name)
        db.add(profile)

    profile.display_name = onboarding.display_name
    profile.institution = onboarding.institution
    profile.degree = onboarding.degree
    profile.branch = onboarding.branch
    profile.current_year = onboarding.current_year
    profile.current_semester = onboarding.current_semester
    profile.expected_graduation_year = onboarding.expected_graduation_year
    profile.current_cgpa = onboarding.current_cgpa
    profile.previous_semester_cgpa = onboarding.previous_semester_cgpa
    profile.target_cgpa = onboarding.target_cgpa
    profile.preferred_study_hours_per_day = onboarding.preferred_study_hours_per_day
    profile.primary_career_goal = onboarding.primary_career_goal
    profile.preferred_programming_language = onboarding.preferred_programming_language
    profile.technical_skill_level = onboarding.technical_skill_level
    profile.weak_subjects = onboarding.weak_subjects
    profile.strong_subjects = onboarding.strong_subjects
    profile.onboarding_completed = True

    # Process subjects and initial attendance records
    for sub_input in onboarding.subjects:
        subject = Subject(
            user_id=user.id,
            name=sub_input.name,
            code=sub_input.code,
            credits=sub_input.credits,
            semester=onboarding.current_semester,
            target_attendance=sub_input.target_attendance
        )
        db.add(subject)
        db.flush()

        if sub_input.initial_conducted > 0:
            att = AttendanceRecord(
                user_id=user.id,
                subject_id=subject.id,
                classes_conducted=sub_input.initial_conducted,
                classes_attended=sub_input.initial_attended,
                notes="Initial onboarding attendance"
            )
            db.add(att)

    # Process initial skills
    for skill_name in onboarding.initial_skills:
        skill = StudentSkill(
            user_id=user.id,
            name=skill_name,
            category="Core Technical",
            current_proficiency=50.0,
            target_proficiency=80.0
        )
        db.add(skill)

    db.commit()
    db.refresh(profile)

    # Generate initial digital twin state snapshot
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return profile
