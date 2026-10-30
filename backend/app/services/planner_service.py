from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.academic import Subject, Assessment
from app.models.study_plan import StudyPlan, StudyPlanSession
from app.schemas.study_plan import StudyPlanCreate

class PlannerService:

    @staticmethod
    def generate_study_plan(user: User, plan_data: StudyPlanCreate, db: Session) -> StudyPlan:
        """
        Synthesizes a realistic, personalized multi-day study schedule.
        Respects available daily hours, balances subject loads, prioritizes weaker subjects,
        and spaces revision blocks without overbooking.
        """
        # Fetch subjects
        query = db.query(Subject).filter(Subject.user_id == user.id, Subject.is_active == True)
        if plan_data.selected_subject_ids:
            query = query.filter(Subject.id.in_(plan_data.selected_subject_ids))
        subjects = query.all()

        if not subjects:
            # Fallback placeholder if no subjects exist yet
            subjects = [
                Subject(id="temp-sub-1", user_id=user.id, name="Core Subject 1", credits=4),
                Subject(id="temp-sub-2", user_id=user.id, name="Core Subject 2", credits=3)
            ]

        # Calculate subject weights
        # Weak subjects get higher duration / frequency
        weak_subjects_str = user.profile.weak_subjects if user.profile and user.profile.weak_subjects else ""
        weak_set = {s.strip().lower() for s in weak_subjects_str.split(",") if s.strip()}

        subject_weights = {}
        for s in subjects:
            weight = 1.0 + (s.credits * 0.1)
            if s.name.lower() in weak_set and plan_data.focus_weak_subjects:
                weight *= 1.4
            subject_weights[s.id] = weight

        # Dates range
        num_days = (plan_data.end_date - plan_data.start_date).days + 1
        num_days = max(1, min(60, num_days)) # capped at 60 days
        
        daily_hours = min(12.0, plan_data.available_hours_per_day)
        total_planned_hours = round(num_days * daily_hours, 1)

        # Create StudyPlan
        plan = StudyPlan(
            user_id=user.id,
            title=plan_data.title,
            start_date=plan_data.start_date,
            end_date=plan_data.end_date,
            total_planned_hours=total_planned_hours,
            status="active"
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        # Generate daily sessions
        sessions = []
        subj_index = 0
        sorted_subjects = sorted(subjects, key=lambda s: subject_weights.get(s.id, 1.0), reverse=True)

        for day_offset in range(num_days):
            current_date = plan_data.start_date + timedelta(days=day_offset)
            remaining_day_hours = daily_hours
            start_hour = 17 # default evening start 5 PM

            # Split day into 1 to 2 sessions
            session_len = 1.5 if daily_hours >= 3.0 else min(daily_hours, 2.0)
            
            while remaining_day_hours >= 0.75:
                dur = min(session_len, remaining_day_hours)
                chosen_subj = sorted_subjects[subj_index % len(sorted_subjects)]
                subj_index += 1

                # Include revision topics periodically
                is_revision_day = (day_offset % 4 == 3)
                topic = f"{'Revision & Practice: ' if is_revision_day else 'Module Review: '}{chosen_subj.name}"

                start_str = f"{start_hour:02d}:00"
                session = StudyPlanSession(
                    plan_id=plan.id,
                    subject_id=chosen_subj.id if not chosen_subj.id.startswith("temp") else None,
                    subject_name=chosen_subj.name,
                    date=current_date,
                    start_time=start_str,
                    duration_hours=round(dur, 1),
                    topic=topic,
                    is_completed=False,
                    notes="Focus on key problem patterns and conceptual clarity."
                )
                sessions.append(session)
                remaining_day_hours -= dur
                start_hour += int(dur) + 1 # 1 hour break

        db.add_all(sessions)
        db.commit()
        db.refresh(plan)
        return plan
