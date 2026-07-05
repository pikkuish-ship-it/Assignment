from pydantic import BaseModel, Field
from typing import List

class ActionItem(BaseModel):
    employee: str = Field(..., description="Name of the employee assigned to the task")
    task: str = Field(..., description="Description of the task")
    deadline: str = Field(..., description="Deadline for the task")

class MeetingResponse(BaseModel):
    meeting_summary: str = Field(..., description="A concise summary of the meeting")
    discussion_points: List[str] = Field(..., description="Key points discussed during the meeting")
    priority: str = Field(..., description="Overall priority level (e.g., Low, Medium, High, Critical)")
    action_items: List[ActionItem] = Field(..., description="List of tasks assigned during the meeting")
    risks: List[str] = Field(..., description="Any risks or blockers identified")
    next_steps: List[str] = Field(..., description="Recommended next steps")
    follow_up_email: str = Field(..., description="Draft of a follow-up email to attendees")
