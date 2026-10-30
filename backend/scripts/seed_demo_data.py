import os
import sys
import json
from datetime import datetime, date, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.profile import StudentProfile
from app.models.academic import Subject, Assessment
from app.models.attendance import AttendanceRecord
from app.models.assignment import Assignment
from app.models.study import DailyStudyLog
from app.models.skill import StudentSkill
from app.models.coding import CodingLog, StudentGoal
from app.models.recommendation import Recommendation
from app.models.digital_twin import DigitalTwinSnapshot
from app.models.simulation import SimulationScenario
from app.models.study_plan import StudyPlan, StudyPlanSession
from app.services.digital_twin_service import DigitalTwinService
from app.services.simulation_service import SimulationService
from app.schemas.simulation import SimulationParameters

DEMO_EMAIL = "demo@studentos.internal"
DEMO_PASSWORD = "StudentOS@Demo2026"

def seed_demo_student():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("=" * 60)
        print("SEEDING STUDENTOS SYNTHETIC DEMO STUDENT")
        print("=" * 60)

        # Check existing demo student and wipe clean if present
        existing_user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing_user:
            print(f"Removing prior demo account: {DEMO_EMAIL}...")
            db.delete(existing_user)
            db.commit()

        # 1. Create User
        demo_user = User(
            email=DEMO_EMAIL,
            hashed_password=get_password_hash(DEMO_PASSWORD),
            is_active=True
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        print(f"Created demo user: {DEMO_EMAIL} (Password: {DEMO_PASSWORD})")

        # 2. Student Profile (3rd Year CSE AIML)
        profile = StudentProfile(
            user_id=demo_user.id,
            display_name="Alex Rivera",
            institution="National Institute of Technology",
            degree="B.Tech",
            branch="Computer Science & Engineering (AIML)",
            current_year=3,
            current_semester=6,
            expected_graduation_year=2027,
            current_cgpa=7.85,
            previous_semester_cgpa=7.60,
            target_cgpa=8.80,
            preferred_study_hours_per_day=3.5,
            primary_career_goal="AI/ML Engineer",
            preferred_programming_language="Python",
            technical_skill_level="Intermediate",
            weak_subjects="Computer Networks, Theory of Computation",
            strong_subjects="Machine Learning, Data Structures & Algorithms",
            onboarding_completed=True
        )
        db.add(profile)
        db.commit()

        # 3. Academic Subjects
        subjects_data = [
            {"name": "Machine Learning", "code": "CS601", "credits": 4, "target_attendance": 75.0},
            {"name": "Deep Learning & Neural Nets", "code": "CS602", "credits": 4, "target_attendance": 80.0},
            {"name": "Computer Networks", "code": "CS603", "credits": 3, "target_attendance": 75.0},
            {"name": "Cloud Computing & DevOps", "code": "CS604", "credits": 3, "target_attendance": 75.0},
            {"name": "Data Engineering Principles", "code": "CS605", "credits": 3, "target_attendance": 75.0},
        ]
        subjects = []
        for s_data in subjects_data:
            s = Subject(user_id=demo_user.id, **s_data, semester=6)
            db.add(s)
            subjects.append(s)
        db.commit()

        # 4. Attendance Records
        # Note: CS603 (Computer Networks) will have lower attendance (~68%) to demonstrate the attendance warning and calculator
        att_data = [
            {"subject": subjects[0], "conducted": 28, "attended": 25}, # ML: 89.3%
            {"subject": subjects[1], "conducted": 26, "attended": 22}, # DL: 84.6%
            {"subject": subjects[2], "conducted": 30, "attended": 20}, # CN: 66.7% (Below target!)
            {"subject": subjects[3], "conducted": 24, "attended": 21}, # Cloud: 87.5%
            {"subject": subjects[4], "conducted": 22, "attended": 18}, # Data Eng: 81.8%
        ]
        for a in att_data:
            rec = AttendanceRecord(
                user_id=demo_user.id,
                subject_id=a["subject"].id,
                classes_conducted=a["conducted"],
                classes_attended=a["attended"],
                date=date.today() - timedelta(days=2),
                notes="Semester cumulative attendance verification"
            )
            db.add(rec)
        db.commit()

        # 5. Assessments
        today = date.today()
        assessments_data = [
            {"subject": subjects[0], "name": "ML Midterm Exam", "type": "midterm", "marks": 42.5, "max": 50.0, "days_ago": 18},
            {"subject": subjects[0], "name": "Supervised Learning Lab", "type": "lab", "marks": 19.0, "max": 20.0, "days_ago": 8},
            {"subject": subjects[1], "name": "Backpropagation Quiz", "type": "quiz", "marks": 22.0, "max": 25.0, "days_ago": 14},
            {"subject": subjects[2], "name": "Routing Protocols Internal", "type": "internal", "marks": 26.0, "max": 50.0, "days_ago": 12}, # 52% (Low!)
            {"subject": subjects[3], "name": "Docker & K8s Assignment", "type": "assignment", "marks": 27.0, "max": 30.0, "days_ago": 6},
            {"subject": subjects[4], "name": "ETL Pipelines Quiz", "type": "quiz", "marks": 17.5, "max": 20.0, "days_ago": 4},
        ]
        for asm in assessments_data:
            rec = Assessment(
                user_id=demo_user.id,
                subject_id=asm["subject"].id,
                name=asm["name"],
                assessment_type=asm["type"],
                marks_obtained=asm["marks"],
                max_marks=asm["max"],
                date=today - timedelta(days=asm["days_ago"]),
                notes="Semester assessment component"
            )
            db.add(rec)
        db.commit()

        # 6. Assignments
        assignments_data = [
            {
                "title": "Build CNN Classifier on CIFAR-10",
                "subject": subjects[1],
                "due": datetime.now(timezone.utc) + timedelta(days=3),
                "est": 4.0,
                "priority": "high",
                "status": "in_progress"
            },
            {
                "title": "Subnetting and VLAN Configuration Lab Report",
                "subject": subjects[2],
                "due": datetime.now(timezone.utc) - timedelta(days=1), # Overdue!
                "est": 2.5,
                "priority": "urgent",
                "status": "not_started"
            },
            {
                "title": "FastAPI Microservice Containerization",
                "subject": subjects[3],
                "due": datetime.now(timezone.utc) + timedelta(days=5),
                "est": 3.0,
                "priority": "medium",
                "status": "not_started"
            },
            {
                "title": "Decision Trees & Random Forests Implementation",
                "subject": subjects[0],
                "due": datetime.now(timezone.utc) - timedelta(days=10),
                "est": 3.5,
                "priority": "high",
                "status": "completed"
            }
        ]
        for asg in assignments_data:
            rec = Assignment(
                user_id=demo_user.id,
                subject_id=asg["subject"].id,
                title=asg["title"],
                due_date=asg["due"],
                estimated_duration_hours=asg["est"],
                priority=asg["priority"],
                status=asg["status"],
                completed_at=datetime.now(timezone.utc) - timedelta(days=9) if asg["status"] == "completed" else None
            )
            db.add(rec)
        db.commit()

        # 7. Daily Study Logs (Past 14 days)
        for i in range(14, 0, -1):
            log_date = today - timedelta(days=i)
            # Skip a couple days to make consistency realistic (e.g. 11/14 days logged)
            if i in [3, 8, 12]:
                continue
            
            hours = 2.5 + (0.5 * (i % 3))
            focus = 3 + (i % 3)
            coding_h = 1.0 if (i % 2 == 0) else 0.5
            dsa_att = 2 if (i % 2 == 0) else 1
            dsa_sol = dsa_att
            
            breakdowns = [
                {"subject_name": "Machine Learning", "duration_hours": round(hours * 0.5, 1)},
                {"subject_name": "Computer Networks", "duration_hours": round(hours * 0.5, 1)}
            ]

            log = DailyStudyLog(
                user_id=demo_user.id,
                date=log_date,
                total_study_hours=round(hours, 1),
                sessions_count=2,
                revision_completed=(i % 3 == 0),
                assignment_work_completed=(i % 4 == 0),
                dsa_problems_attempted=dsa_att,
                dsa_problems_solved=dsa_sol,
                coding_practice_hours=coding_h,
                focus_rating=focus,
                difficulty_rating=3,
                notes=f"Day {15-i} review of neural architectures and networking fundamentals.",
                subject_breakdown=json.dumps(breakdowns)
            )
            db.add(log)
        db.commit()

        # 8. Technical Skills
        skills_data = [
            {"name": "Python", "category": "Programming Languages", "current": 85.0, "target": 90.0},
            {"name": "Machine Learning", "category": "AI/ML", "current": 78.0, "target": 85.0},
            {"name": "Deep Learning", "category": "AI/ML", "current": 60.0, "target": 80.0}, # gap = 20%
            {"name": "Data Structures & Algorithms", "category": "DSA", "current": 72.0, "target": 85.0},
            {"name": "SQL & Databases", "category": "Databases", "current": 70.0, "target": 80.0},
            {"name": "System Design", "category": "System Design", "current": 45.0, "target": 75.0}, # gap = 30%
            {"name": "Docker & DevOps", "category": "Cloud/DevOps", "current": 55.0, "target": 75.0},
        ]
        for sk in skills_data:
            s_rec = StudentSkill(
                user_id=demo_user.id,
                name=sk["name"],
                category=sk["category"],
                current_proficiency=sk["current"],
                target_proficiency=sk["target"],
                notes="Self-assessed via laboratory projects and coding practice"
            )
            db.add(s_rec)
        db.commit()

        # 9. Coding & DSA Logs
        coding_data = [
            {"title": "Two Sum", "topic": "Arrays", "diff": "Easy", "stat": "Solved", "time": 20, "days": 13},
            {"title": "3Sum", "topic": "Two Pointers", "diff": "Medium", "stat": "Solved", "time": 45, "days": 11},
            {"title": "Longest Substring Without Repeating Characters", "topic": "Sliding Window", "diff": "Medium", "stat": "Solved", "time": 40, "days": 9},
            {"title": "LRU Cache", "topic": "Design / Linked List", "diff": "Medium", "stat": "Solved", "time": 50, "days": 7},
            {"title": "Coin Change", "topic": "Dynamic Programming", "diff": "Medium", "stat": "Solved", "time": 55, "days": 5},
            {"title": "Word Break", "topic": "Dynamic Programming", "diff": "Medium", "stat": "Attempted", "time": 60, "days": 2},
            {"title": "Course Schedule II", "topic": "Graphs / Topological Sort", "diff": "Medium", "stat": "Solved", "time": 45, "days": 1},
        ]
        for c in coding_data:
            cl = CodingLog(
                user_id=demo_user.id,
                problem_title=c["title"],
                platform="LeetCode",
                language="Python",
                topic=c["topic"],
                difficulty=c["diff"],
                status=c["stat"],
                time_spent_minutes=c["time"],
                confidence_rating=4,
                date=today - timedelta(days=c["days"]),
                notes="Practiced during evening coding session"
            )
            db.add(cl)
        db.commit()

        # 10. Student Goals
        goals_data = [
            {"title": "Achieve 8.80 CGPA in Semester 6", "type": "cgpa", "target": 8.80, "current": 7.85, "unit": "CGPA"},
            {"title": "Solve 100 Medium DSA Problems", "type": "dsa_count", "target": 100.0, "current": 38.0, "unit": "problems"},
            {"title": "Average 20 Study Hours Weekly", "type": "study_hours", "target": 20.0, "current": 16.5, "unit": "hrs/week"},
            {"title": "Reach 80% System Design Proficiency", "type": "skill_target", "target": 80.0, "current": 45.0, "unit": "%"}
        ]
        for g in goals_data:
            g_rec = StudentGoal(
                user_id=demo_user.id,
                title=g["title"],
                goal_type=g["type"],
                target_value=g["target"],
                current_value=g["current"],
                unit=g["unit"],
                deadline=today + timedelta(days=60)
            )
            db.add(g_rec)
        db.commit()

        # 11. Synchronize Digital Twin State Snapshot
        snapshot = DigitalTwinService.sync_digital_twin_snapshot(demo_user, db)
        print(f"Digital Twin Snapshot initialized: Predicted CGPA = {snapshot.predicted_cgpa}, Risk = {snapshot.academic_risk_level}")

        # 12. Create a Saved What-If Scenario to Showcase Simulator
        sim_params = SimulationParameters(
            daily_study_hours=4.0,
            attendance_percentage=85.0,
            assignment_completion_rate=100.0,
            internal_assessment_average=85.0
        )
        sim_result = SimulationService.run_what_if_simulation(
            user=demo_user,
            params=sim_params,
            db=db,
            scenario_name="Habit Improvement Scenario"
        )
        saved_scenario = SimulationScenario(
            user_id=demo_user.id,
            name="Habit Improvement Scenario",
            description="Simulating the impact of increasing study to 4h/day, clearing backlogs, and attending 85% of Computer Networks lectures.",
            baseline_snapshot_id=snapshot.id,
            modified_parameters=json.dumps(sim_result.modified_parameters),
            baseline_prediction=json.dumps(sim_result.baseline_prediction.model_dump()),
            simulated_prediction=json.dumps(sim_result.simulated_prediction.model_dump()),
            impact_summary=json.dumps(sim_result.impact.model_dump())
        )
        db.add(saved_scenario)
        db.commit()

        # 13. Create an Initial Study Plan
        plan = StudyPlan(
            user_id=demo_user.id,
            title="Midterm Preparation Sprint",
            start_date=today,
            end_date=today + timedelta(days=14),
            total_planned_hours=42.0,
            status="active"
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        for day_i in range(14):
            session = StudyPlanSession(
                plan_id=plan.id,
                subject_id=subjects[day_i % len(subjects)].id,
                subject_name=subjects[day_i % len(subjects)].name,
                date=today + timedelta(days=day_i),
                start_time="17:00",
                duration_hours=2.0,
                topic=f"Focused Review: {subjects[day_i % len(subjects)].name}",
                is_completed=(day_i < 3) # first 3 days completed
            )
            db.add(session)
        db.commit()

        print("\n" + "=" * 60)
        print("DEMO STUDENT SEEDED SUCCESSFULLY!")
        print(f"Login Credentials:")
        print(f"  Email   : {DEMO_EMAIL}")
        print(f"  Password: {DEMO_PASSWORD}")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_student()
