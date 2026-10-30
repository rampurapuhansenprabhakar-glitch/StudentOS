import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
import httpx
from app.models.user import User
from app.services.digital_twin_service import DigitalTwinService
from app.services.recommendation_service import RecommendationService
from app.core.config import settings
from app.core.logging import logger
from app.schemas.assistant import AssistantChatResponse

class AssistantService:

    @staticmethod
    def get_grounded_context(user: User, db: Session) -> Dict[str, Any]:
        """
        Extracts structured, strictly user-isolated context from the student's digital twin.
        """
        state = DigitalTwinService.compute_student_state(user, db)
        recs = RecommendationService.generate_recommendations_for_student(user, db)
        
        return {
            "display_name": user.profile.display_name if user.profile else "Student",
            "academic": state["academic_state"],
            "behavioral": state["behavioral_state"],
            "skills": state["skill_state"],
            "coding": state["coding_state"],
            "predicted_cgpa": state["predicted_cgpa"],
            "academic_risk_level": state["academic_risk_level"],
            "academic_risk_probability": state["academic_risk_probability"],
            "active_recommendations": [r.title for r in recs[:3]]
        }

    @staticmethod
    async def process_chat(user: User, message: str, db: Session) -> AssistantChatResponse:
        context = AssistantService.get_grounded_context(user, db)
        
        # 1. Attempt local Ollama if enabled
        if settings.ENABLE_OLLAMA:
            try:
                system_prompt = (
                    "You are StudentOS Copilot, an AI digital twin mentor for college students. "
                    "Use ONLY the following verified student data to answer questions accurately and supportively. "
                    "Never invent grades, attendance numbers, or external facts.\n"
                    f"STUDENT CONTEXT: {json.dumps(context)}"
                )
                payload = {
                    "model": settings.OLLAMA_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    "stream": False
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(f"{settings.OLLAMA_BASE_URL}/api/chat", json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        reply_text = data.get("message", {}).get("content", "")
                        return AssistantChatResponse(
                            reply=reply_text,
                            suggested_actions=["View Digital Twin", "Run What-If Simulation"],
                            source="ollama",
                            context_used=context
                        )
            except Exception as e:
                logger.warning(f"Ollama local LLM connection failed: {e}. Falling back to grounded assistant.")

        # 2. Grounded deterministic assistant fallback
        msg_lower = message.lower()
        pred_cgpa = context["predicted_cgpa"]
        risk = context["academic_risk_level"]
        att = context["academic"]["attendance_percentage"]
        study_h = context["behavioral"]["daily_study_hours"]
        consistency = context["behavioral"]["study_consistency_score"]
        active_recs = context["active_recommendations"]

        if any(w in msg_lower for w in ["cgpa", "predict", "projection", "score", "future"]):
            reply = (
                f"Based on your Digital Twin metrics, your current performance prediction is **{pred_cgpa} CGPA** "
                f"with an academic risk classification of **{risk}** (risk probability: {context['academic_risk_probability']*100:.1f}%). "
                f"This forecast is derived from your previous CGPA ({context['academic']['previous_cgpa']}), "
                f"attendance ({att}%), and your recent study consistency ({consistency}%)."
            )
            suggested = ["Run What-If Simulation", "View Academic Breakdown"]

        elif any(w in msg_lower for w in ["attendance", "class", "absent", "bunk"]):
            if att < 75.0:
                reply = (
                    f"Your current overall attendance is **{att}%**, which is currently below the 75% target threshold. "
                    f"We strongly recommend checking the Attendance Calculator to see how many consecutive classes you need to attend."
                )
            else:
                reply = (
                    f"Your overall attendance is currently healthy at **{att}%**, maintaining compliance above the 75% target threshold."
                )
            suggested = ["Open Attendance Calculator", "View Subject Attendance"]

        elif any(w in msg_lower for w in ["consistency", "study", "hours", "routine", "habit"]):
            reply = (
                f"Over the last 14 days, you logged study records on {context['behavioral']['days_logged_last_14_days']} days, "
                f"giving a study consistency score of **{consistency}%** and an average daily study time of **{study_h} hours/day**. "
                f"Regular study sessions of 45-90 minutes have a measurable positive weight in your digital twin performance model."
            )
            suggested = ["Log Daily Study Session", "Generate Study Plan"]

        elif any(w in msg_lower for w in ["dsa", "coding", "leetcode", "problem"]):
            problems = context["coding"]["problems_solved"]
            weekly_h = context["coding"]["coding_hours_per_week"]
            reply = (
                f"You have recorded **{problems} problems solved** with approximately **{weekly_h} hours/week** devoted to coding. "
                f"Staying consistent with at least 1-2 problems every other day builds lasting problem-solving patterns."
            )
            suggested = ["Record Coding Problem", "View Skill Radar"]

        elif any(w in msg_lower for w in ["recommend", "advice", "action", "focus", "help"]):
            recs_text = "\n".join([f"• {r}" for r in active_recs]) if active_recs else "• Maintain your current consistent study routine!"
            reply = (
                f"Here are the top high-priority actions derived from your digital twin state:\n\n{recs_text}\n\n"
                f"You can view complete explanations and mark them completed in the Recommendations hub."
            )
            suggested = ["Open Recommendations Hub", "Simulate Impact"]

        else:
            reply = (
                f"Hello {context['display_name']}! I am your StudentOS Digital Twin Assistant. "
                f"Your digital twin is currently tracking: Current CGPA ({context['academic']['current_cgpa']}), "
                f"Predicted Next CGPA ({pred_cgpa}), Attendance ({att}%), and Study Consistency ({consistency}%). "
                f"You can ask me about your academic projection, attendance requirements, study habits, or coding progress."
            )
            suggested = ["Explain my academic projection", "What should I focus on this week?", "Simulate study improvement"]

        return AssistantChatResponse(
            reply=reply,
            suggested_actions=suggested,
            source="grounded_rule_engine",
            context_used=context
        )
