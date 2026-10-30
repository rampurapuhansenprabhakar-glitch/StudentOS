from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.skill import StudentSkill
from app.schemas.skill import (
    StudentSkillCreate, StudentSkillUpdate, StudentSkillResponse,
    SkillGapItem, CareerRoleRequirement, SkillGapAnalysisResponse
)
from app.api.dependencies import get_current_user
from app.services.digital_twin_service import DigitalTwinService

router = APIRouter(prefix="/skills", tags=["Skills & Gap Analysis"])

# Reference Industry Role Profiles
STANDARD_CAREER_ROLES = [
    {
        "role_name": "AI/ML Engineer",
        "description": "Develops machine learning models, data pipelines, and deep learning architectures.",
        "required_skills": [
            {"name": "Python", "min_proficiency": 85.0},
            {"name": "Machine Learning", "min_proficiency": 80.0},
            {"name": "Data Structures & Algorithms", "min_proficiency": 75.0},
            {"name": "Mathematics & Statistics", "min_proficiency": 75.0},
            {"name": "SQL & Databases", "min_proficiency": 70.0},
            {"name": "Deep Learning", "min_proficiency": 70.0}
        ]
    },
    {
        "role_name": "Software Engineer (Backend)",
        "description": "Designs scalable server-side systems, REST APIs, and distributed architectures.",
        "required_skills": [
            {"name": "Data Structures & Algorithms", "min_proficiency": 85.0},
            {"name": "Backend Development", "min_proficiency": 80.0},
            {"name": "SQL & Databases", "min_proficiency": 80.0},
            {"name": "System Design", "min_proficiency": 70.0},
            {"name": "Computer Networks", "min_proficiency": 70.0},
            {"name": "Operating Systems", "min_proficiency": 70.0}
        ]
    },
    {
        "role_name": "Full Stack Engineer",
        "description": "Builds end-to-end web applications with modern frontend and backend architectures.",
        "required_skills": [
            {"name": "JavaScript/TypeScript", "min_proficiency": 80.0},
            {"name": "React / Next.js", "min_proficiency": 80.0},
            {"name": "Backend Development", "min_proficiency": 75.0},
            {"name": "SQL & Databases", "min_proficiency": 70.0},
            {"name": "Data Structures & Algorithms", "min_proficiency": 70.0}
        ]
    },
    {
        "role_name": "Data Scientist",
        "description": "Extracts actionable insights through statistical analysis, predictive modeling, and data storytelling.",
        "required_skills": [
            {"name": "Python", "min_proficiency": 85.0},
            {"name": "SQL & Databases", "min_proficiency": 85.0},
            {"name": "Data Analysis & Pandas", "min_proficiency": 80.0},
            {"name": "Machine Learning", "min_proficiency": 75.0},
            {"name": "Data Visualization", "min_proficiency": 75.0}
        ]
    }
]

@router.get("", response_model=List[StudentSkillResponse])
def get_skills(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    skills = db.query(StudentSkill).filter(StudentSkill.user_id == user.id).all()
    resp = []
    for s in skills:
        resp.append(
            StudentSkillResponse(
                id=s.id,
                user_id=s.user_id,
                name=s.name,
                category=s.category,
                current_proficiency=s.current_proficiency,
                target_proficiency=s.target_proficiency,
                skill_gap=s.skill_gap,
                notes=s.notes,
                last_assessed_at=s.last_assessed_at,
                created_at=s.created_at,
                updated_at=s.updated_at
            )
        )
    return resp

@router.post("", response_model=StudentSkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(
    skill_in: StudentSkillCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = StudentSkill(**skill_in.model_dump(), user_id=user.id)
    db.add(skill)
    db.commit()
    db.refresh(skill)

    DigitalTwinService.sync_digital_twin_snapshot(user, db)

    return StudentSkillResponse(
        id=skill.id,
        user_id=skill.user_id,
        name=skill.name,
        category=skill.category,
        current_proficiency=skill.current_proficiency,
        target_proficiency=skill.target_proficiency,
        skill_gap=skill.skill_gap,
        notes=skill.notes,
        last_assessed_at=skill.last_assessed_at,
        created_at=skill.created_at,
        updated_at=skill.updated_at
    )

@router.patch("/{skill_id}", response_model=StudentSkillResponse)
def update_skill(
    skill_id: str,
    skill_in: StudentSkillUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(StudentSkill).filter(StudentSkill.id == skill_id, StudentSkill.user_id == user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    for field, val in skill_in.model_dump(exclude_unset=True).items():
        setattr(skill, field, val)

    db.commit()
    db.refresh(skill)
    DigitalTwinService.sync_digital_twin_snapshot(user, db)

    return StudentSkillResponse(
        id=skill.id,
        user_id=skill.user_id,
        name=skill.name,
        category=skill.category,
        current_proficiency=skill.current_proficiency,
        target_proficiency=skill.target_proficiency,
        skill_gap=skill.skill_gap,
        notes=skill.notes,
        last_assessed_at=skill.last_assessed_at,
        created_at=skill.created_at,
        updated_at=skill.updated_at
    )

@router.delete("/{skill_id}", status_code=status.HTTP_200_OK)
def delete_skill(
    skill_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(StudentSkill).filter(StudentSkill.id == skill_id, StudentSkill.user_id == user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    db.delete(skill)
    db.commit()
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return {"message": "Skill deleted successfully"}

@router.get("/analysis", response_model=SkillGapAnalysisResponse)
def get_skill_gap_analysis(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skills = db.query(StudentSkill).filter(StudentSkill.user_id == user.id).all()
    if not skills:
        return SkillGapAnalysisResponse(
            average_proficiency=0.0,
            total_skills_tracked=0,
            top_skill_gaps=[],
            career_role_readiness=[]
        )

    avg_prof = round(sum(s.current_proficiency for s in skills) / len(skills), 1)

    skill_gaps = []
    skill_lookup = {s.name.lower(): s.current_proficiency for s in skills}

    for s in skills:
        gap = s.skill_gap
        priority = "High" if gap >= 30.0 else ("Medium" if gap >= 15.0 else "Low")
        skill_gaps.append(
            SkillGapItem(
                skill_name=s.name,
                category=s.category,
                current_proficiency=s.current_proficiency,
                target_proficiency=s.target_proficiency,
                gap=gap,
                priority=priority
            )
        )
    skill_gaps.sort(key=lambda x: x.gap, reverse=True)

    # Evaluate against Career Roles
    role_readiness = []
    for role in STANDARD_CAREER_ROLES:
        reqs = role["required_skills"]
        match_count = 0
        readiness_scores = []
        missing = []

        for req in reqs:
            r_name = req["name"]
            min_p = req["min_proficiency"]
            
            # Find best match in student skills
            student_p = 0.0
            for s_name_low, p_val in skill_lookup.items():
                if r_name.lower() in s_name_low or s_name_low in r_name.lower():
                    student_p = max(student_p, p_val)

            if student_p >= min_p:
                match_count += 1
                readiness_scores.append(100.0)
            elif student_p > 0:
                readiness_scores.append((student_p / min_p) * 100.0)
                missing.append(f"{r_name} ({student_p:.0f}% / {min_p:.0f}%)")
            else:
                readiness_scores.append(0.0)
                missing.append(f"{r_name} (Not tracked)")

        overall_readiness = round(sum(readiness_scores) / len(reqs), 1)
        role_readiness.append(
            CareerRoleRequirement(
                role_name=role["role_name"],
                description=role["description"],
                required_skills=reqs,
                readiness_percentage=overall_readiness,
                matching_skills_count=match_count,
                missing_skills=missing
            )
        )

    return SkillGapAnalysisResponse(
        average_proficiency=avg_prof,
        total_skills_tracked=len(skills),
        top_skill_gaps=skill_gaps[:6],
        career_role_readiness=role_readiness
    )
