from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str # "user", "assistant", "system"
    content: str

class AssistantChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = None

class AssistantChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = []
    source: str # "ollama" or "grounded_rule_engine"
    context_used: Dict[str, Any] = {}
