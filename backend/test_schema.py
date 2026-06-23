import uuid
from datetime import datetime
from app.db.models import ChatMessage, ChatRole
from app.db.schemas import ChatMessageResponse

msg = ChatMessage(
    id=uuid.uuid4(),
    review_id=uuid.uuid4(),
    role=ChatRole.USER,
    content="Hello",
    created_at=datetime.utcnow()
)

response = ChatMessageResponse.model_validate(msg)
print(response.model_dump_json())
