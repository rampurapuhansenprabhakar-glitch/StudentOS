from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.api.dependencies import get_current_user
from app.services.assistant_service import AssistantService

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(
    req: AssistantChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await AssistantService.process_chat(
        user=user,
        message=req.message,
        db=db
    )
