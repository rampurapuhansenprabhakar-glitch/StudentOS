from datetime import datetime, date, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.recommendation import Recommendation
from app.models.academic import Subject, Assessment
from app.models.attendance import AttendanceRecord
from app.models.assignment import Assignment
from app.models.study import DailyStudyLog
from app.models.skill import StudentSkill
from app.models.coding import CodingLog

class RecommendationService:

    @staticmethod
    def generate_recommendations_for_student(user: User, db: Session) -> List[Recommendation]:
        """
        Analyzes the student's actual state and generates personalized, actionable interventions.
        Does not overwhelm the student: produces high-value, prioritized recommendations.
        """
        existing_active = db.query(Recommendation).filter(
            Recommendation.user_id == user.id,
            Recommendation.status == "active"
        ).all()
        existing_titles = {r.title for r in existing_active}

        new_recs = []
        now = datetime.now(timezone.utc)

        # 1. Attendance Check
        attendance_recs = db.query(AttendanceRecord).filter(AttendanceRecord.user_id == user.id).all()
        for rec in attendance_recs:
            if rec.classes_conducted > 0 and rec.percentage < 75.0:
                title = f"Attendance Recovery: {rec.subject.name if rec.subject else 'Subject'}"
                if title not in existing_titles:
                    needed = int(round((0.75 * rec.classes_conducted - rec.classes_attended) / 0.25))
                    needed = max(1, needed)
                    rec_obj = Recommendation(
                        user_id=user.id,
                        title=title,
                        reason=f"Current attendance is {rec.percentage}%, below the institutional target threshold of 75%.",
                        evidence=f"Attended {rec.classes_attended} out of {rec.classes_conducted} classes conducted.",
                        priority="high",
                        suggested_action=f"Attend the next {needed} consecutive lectures without absence to reach the 75% benchmark.",
                        expected_effort_hours=float(needed),
                        related_weakness="Attendance Compliance",
                        category="attendance",
                        status="active"
                    )
                    new_recs.append(rec_obj)

        # 2. Low Internal Assessment Check
        assessments = db.query(Assessment).filter(Assessment.user_id == user.id).all()
        subject_scores = {}
        for a in assessments:
            pct = (a.marks_obtained / a.max_marks) * 100.0
            subject_scores.setdefault(a.subject.name if a.subject else "Subject", []).append(pct)

        for subj_name, scores in subject_scores.items():
            avg_score = sum(scores) / len(scores)
            if avg_score < 60.0:
                title = f"Targeted Academic Revision: {subj_name}"
                if title not in existing_titles:
                    rec_obj = Recommendation(
                        user_id=user.id,
                        title=title,
                        reason=f"Average internal assessment score in {subj_name} is {avg_score:.1f}%, indicating conceptual gaps.",
                        evidence=f"Recorded scores across {len(scores)} assessments average below 60%.",
                        priority="high",
                        suggested_action=f"Schedule two 90-minute focused revision blocks this week addressing fundamental concepts and past question patterns in {subj_name}.",
                        expected_effort_hours=3.0,
                        related_weakness=subj_name,
                        category="academic",
                        status="active"
                    )
                    new_recs.append(rec_obj)

        # 3. Overdue Assignments Check
        overdue_assignments = db.query(Assignment).filter(
            Assignment.user_id == user.id,
            Assignment.status.in_(["overdue", "not_started"]),
            Assignment.due_date < now
        ).all()

        if overdue_assignments:
            title = "Clear Pending Academic Deadlines"
            if title not in existing_titles:
                rec_obj = Recommendation(
                    user_id=user.id,
                    title=title,
                    reason=f"You have {len(overdue_assignments)} overdue assignment(s) that may incur grade penalties.",
                    evidence=f"Pending: {', '.join(a.title for a in overdue_assignments[:2])}",
                    priority="high",
                    suggested_action="Dedicate an uninterrupted 2-hour sprint today to complete and submit the oldest overdue assignment.",
                    expected_effort_hours=2.0,
                    related_weakness="Task Prioritization",
                    category="study",
                    status="active"
                )
                new_recs.append(rec_obj)

        # 4. Study Consistency Check
        two_week_cutoff = date.today() - timedelta(days=14)
        study_logs = db.query(DailyStudyLog).filter(
            DailyStudyLog.user_id == user.id,
            DailyStudyLog.date >= two_week_cutoff
        ).all()

        if len(study_logs) < 6 and len(study_logs) > 0:
            title = "Stabilize Study Routine"
            if title not in existing_titles:
                rec_obj = Recommendation(
                    user_id=user.id,
                    title=title,
                    reason=f"You logged study sessions on only {len(study_logs)} of the past 14 days.",
                    evidence=f"Current study consistency score is {(len(study_logs)/14.0)*100:.1f}%.",
                    priority="medium",
                    suggested_action="Aim for at least 45 minutes of daily focused study for 5 consecutive days to re-establish your baseline habit.",
                    expected_effort_hours=3.75,
                    related_weakness="Study Consistency",
                    category="study",
                    status="active"
                )
                new_recs.append(rec_obj)

        # 5. Technical Skill Gaps Check
        skills = db.query(StudentSkill).filter(StudentSkill.user_id == user.id).all()
        for skill in skills:
            if skill.skill_gap >= 35.0:
                title = f"Skill Enhancement Sprint: {skill.name}"
                if title not in existing_titles:
                    rec_obj = Recommendation(
                        user_id=user.id,
                        title=title,
                        reason=f"Identified proficiency gap of {skill.skill_gap:.0f}% in {skill.name} relative to your target {skill.target_proficiency:.0f}%.",
                        evidence=f"Current self-assessed proficiency is {skill.current_proficiency}%.",
                        priority="medium",
                        suggested_action=f"Complete a hands-on project module or practice problem set in {skill.name} over the next weekend.",
                        expected_effort_hours=4.0,
                        related_weakness=skill.name,
                        category="skills",
                        status="active"
                    )
                    new_recs.append(rec_obj)

        # 6. DSA Velocity Check
        coding_logs = db.query(CodingLog).filter(
            CodingLog.user_id == user.id,
            CodingLog.date >= two_week_cutoff
        ).all()
        solved_count = len([c for c in coding_logs if c.status == "Solved"])
        if solved_count < 3 and len(coding_logs) > 0:
            title = "Maintain DSA Problem-Solving Cadence"
            if title not in existing_titles:
                rec_obj = Recommendation(
                    user_id=user.id,
                    title=title,
                    reason="DSA practice has slowed down recently with fewer than 3 problems solved in the last 14 days.",
                    evidence=f"Recorded {solved_count} solved problem(s) in the two-week observation period.",
                    priority="medium",
                    suggested_action="Solve 1 Medium difficulty problem in Arrays or Hashing every other day.",
                    expected_effort_hours=2.5,
                    related_weakness="DSA Practice Cadence",
                    category="coding",
                    status="active"
                )
                new_recs.append(rec_obj)

        if new_recs:
            db.add_all(new_recs)
            db.commit()

        # Return all active recommendations ordered by priority
        priority_order = {"high": 1, "medium": 2, "low": 3}
        all_active = db.query(Recommendation).filter(
            Recommendation.user_id == user.id,
            Recommendation.status == "active"
        ).all()
        all_active.sort(key=lambda r: priority_order.get(r.priority, 4))
        return all_active
