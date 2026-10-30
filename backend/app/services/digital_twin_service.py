import json
from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.profile import StudentProfile
from app.models.academic import Subject, Assessment
from app.models.attendance import AttendanceRecord
from app.models.assignment import Assignment
from app.models.study import DailyStudyLog
from app.models.skill import StudentSkill
from app.models.coding import CodingLog, StudentGoal
from app.models.digital_twin import DigitalTwinSnapshot
from app.ml.artifact_loader import model_loader
from app.ml.features import FEATURE_NAMES

class DigitalTwinService:

    @staticmethod
    def compute_student_state(user: User, db: Session) -> Dict[str, Any]:
        """
        Gathers raw multi-dimensional student data and calculates derived features
        forming the digital twin representation.
        """
        profile: Optional[StudentProfile] = user.profile
        subjects = db.query(Subject).filter(Subject.user_id == user.id, Subject.is_active == True).all()
        assessments = db.query(Assessment).filter(Assessment.user_id == user.id).all()
        attendance_recs = db.query(AttendanceRecord).filter(AttendanceRecord.user_id == user.id).all()
        assignments = db.query(Assignment).filter(Assignment.user_id == user.id).all()
        
        # Study logs over the past 30 days
        cutoff_date = date.today() - timedelta(days=30)
        study_logs = db.query(DailyStudyLog).filter(
            DailyStudyLog.user_id == user.id,
            DailyStudyLog.date >= cutoff_date
        ).all()
        
        skills = db.query(StudentSkill).filter(StudentSkill.user_id == user.id).all()
        coding_logs = db.query(CodingLog).filter(CodingLog.user_id == user.id).all()
        goals = db.query(StudentGoal).filter(StudentGoal.user_id == user.id).all()

        # 1. Academic State
        prev_cgpa = profile.previous_semester_cgpa if profile and profile.previous_semester_cgpa is not None else 7.5
        curr_cgpa = profile.current_cgpa if profile and profile.current_cgpa is not None else prev_cgpa
        target_cgpa = profile.target_cgpa if profile and profile.target_cgpa is not None else 9.0
        cgpa_trend = round(curr_cgpa - prev_cgpa, 2)

        if assessments:
            total_score = sum((a.marks_obtained / a.max_marks) * 100 for a in assessments)
            internal_assessment_avg = round(total_score / len(assessments), 2)
        else:
            internal_assessment_avg = 70.0 # baseline default

        # 2. Attendance State
        tot_conducted = sum(r.classes_conducted for r in attendance_recs)
        tot_attended = sum(r.classes_attended for r in attendance_recs)
        if tot_conducted > 0:
            overall_attendance = round((tot_attended / tot_conducted) * 100.0, 2)
        else:
            overall_attendance = 80.0

        # 3. Assignment State
        completed_assignments = [a for a in assignments if a.status == "completed"]
        assignment_completion_rate = round(
            (len(completed_assignments) / len(assignments) * 100.0) if assignments else 85.0, 2
        )

        # 4. Behavioral State (Study Tracker)
        total_days_in_window = 14 # 2-week rolling window
        two_week_cutoff = date.today() - timedelta(days=total_days_in_window)
        recent_logs = [l for l in study_logs if l.date >= two_week_cutoff]
        logged_days_count = len(recent_logs)
        study_consistency = round((logged_days_count / total_days_in_window) * 100.0, 2)

        if recent_logs:
            daily_study_hours = round(sum(l.total_study_hours for l in recent_logs) / total_days_in_window, 2)
            avg_focus = round(sum(l.focus_rating for l in recent_logs) / len(recent_logs), 2)
        else:
            daily_study_hours = profile.preferred_study_hours_per_day if profile and profile.preferred_study_hours_per_day else 2.5
            avg_focus = 3.5

        # 5. Coding & DSA State
        total_solved = sum(l.dsa_problems_solved for l in study_logs) + len([c for c in coding_logs if c.status == "Solved"])
        total_coding_hours = sum(l.coding_practice_hours for l in study_logs) + sum(c.time_spent_minutes / 60.0 for c in coding_logs)
        coding_hours_per_week = round((total_coding_hours / 4.0), 2) # approx 4 weeks in month

        # 6. Skill State
        avg_proficiency = round(sum(s.current_proficiency for s in skills) / len(skills), 2) if skills else 50.0

        # Assemble Derived Features for ML Pipeline
        derived_features = {
            "previous_cgpa": prev_cgpa,
            "cgpa_trend": cgpa_trend,
            "internal_assessment_avg": internal_assessment_avg,
            "attendance_percentage": overall_attendance,
            "assignment_completion_rate": assignment_completion_rate,
            "daily_study_hours": daily_study_hours,
            "study_consistency": study_consistency,
            "backlog_count": 0.0, # default 0 unless indicated
            "coding_practice_hours_per_week": coding_hours_per_week,
            "average_focus_rating": avg_focus,
        }

        # Data completeness calculation
        completeness_checks = [
            profile is not None and profile.onboarding_completed,
            len(subjects) > 0,
            len(assessments) > 0,
            tot_conducted > 0,
            len(assignments) > 0,
            len(recent_logs) >= 3,
            len(skills) > 0,
            len(coding_logs) > 0 or total_solved > 0
        ]
        completeness_pct = round((sum(1 for c in completeness_checks if c) / len(completeness_checks)) * 100.0, 1)

        # ML Predictions
        pred_cgpa, perf_meta = model_loader.predict_performance(derived_features)
        risk_level, risk_prob, risk_meta = model_loader.predict_risk(derived_features)

        academic_state = {
            "current_cgpa": curr_cgpa,
            "previous_cgpa": prev_cgpa,
            "target_cgpa": target_cgpa,
            "subjects_count": len(subjects),
            "internal_assessment_avg": internal_assessment_avg,
            "attendance_percentage": overall_attendance,
            "backlogs": 0
        }

        behavioral_state = {
            "daily_study_hours": daily_study_hours,
            "study_consistency_score": study_consistency,
            "average_focus_rating": avg_focus,
            "days_logged_last_14_days": logged_days_count,
            "assignment_completion_rate": assignment_completion_rate
        }

        skill_state = {
            "skills_count": len(skills),
            "average_proficiency": avg_proficiency,
            "career_goal": profile.primary_career_goal if profile else "Software Engineer"
        }

        coding_state = {
            "problems_solved": total_solved,
            "coding_hours_per_week": coding_hours_per_week
        }

        return {
            "user_id": user.id,
            "last_updated": datetime.now(timezone.utc),
            "academic_state": academic_state,
            "behavioral_state": behavioral_state,
            "skill_state": skill_state,
            "coding_state": coding_state,
            "derived_features": derived_features,
            "predicted_cgpa": pred_cgpa,
            "academic_risk_level": risk_level,
            "academic_risk_probability": risk_prob,
            "model_version": perf_meta.get("version", "v1.0"),
            "data_completeness_percentage": completeness_pct
        }

    @staticmethod
    def sync_digital_twin_snapshot(user: User, db: Session) -> DigitalTwinSnapshot:
        """
        Recalculates state and writes an immutable versioned snapshot.
        Preserves historical observations while keeping the digital twin up to date.
        """
        state = DigitalTwinService.compute_student_state(user, db)

        snapshot = DigitalTwinSnapshot(
            user_id=user.id,
            timestamp=datetime.now(timezone.utc),
            academic_state=json.dumps(state["academic_state"]),
            behavioral_state=json.dumps(state["behavioral_state"]),
            skill_state=json.dumps(state["skill_state"]),
            coding_state=json.dumps(state["coding_state"]),
            derived_features=json.dumps(state["derived_features"]),
            predicted_cgpa=state["predicted_cgpa"],
            academic_risk_level=state["academic_risk_level"],
            academic_risk_probability=state["academic_risk_probability"],
            model_version=state["model_version"]
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return snapshot
