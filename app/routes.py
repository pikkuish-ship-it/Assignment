import os
import httpx
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from services.gemini_service import process_meeting_notes
from services.n8n_service import send_to_webhook

router = APIRouter()
templates = Jinja2Templates(directory="templates")

class MeetingRequest(BaseModel):
    meeting_notes: str

@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.post("/process-meeting")
async def process_meeting(request: MeetingRequest):
    if not request.meeting_notes or not request.meeting_notes.strip():
        raise HTTPException(status_code=400, detail="Meeting notes cannot be empty")
    
    try:
        result = await process_meeting_notes(request.meeting_notes)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while processing: {str(e)}")

@router.post("/send-to-n8n")
async def send_to_n8n(payload: dict):
    return send_to_webhook(payload)
