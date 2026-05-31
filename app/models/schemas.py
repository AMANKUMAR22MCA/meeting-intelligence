from pydantic import BaseModel
from datetime import datetime
from typing import Optional
class ActionItem(BaseModel):
    task: str
    owner: str
    deadline: str

class Analysis(BaseModel):
    summary: str
    key_points: list[str]
    action_items: list[ActionItem]
    meeting_sentiment: str

class UploadResponse(BaseModel):
    id: int
    created_at: datetime
    filename: str
    transcript: str
    analysis: Analysis



    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "created_at": "2026-05-22T10:30:00Z",
                "filename": "meeting.mp3",
                "transcript": "Good morning everyone...",
                "analysis": {
                    "summary": "Q3 product launch discussion",
                    "key_points": ["Budget approved"],
                    "action_items": [{"task": "Build demo", "owner": "Sarah", "deadline": "Wednesday"}],
                    "meeting_sentiment": "positive"
                }
            }
        }

class MeetingResponse(BaseModel):
    id: int
    filename: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    action_items: Optional[list[ActionItem]] = None
    sentiment: Optional[str] = None
    processing_time: Optional[float] = None
    status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True