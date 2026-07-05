import os
import json
import google.generativeai as genai
from models.response_models import MeetingResponse
from prompts.meeting_prompt import MEETING_ANALYSIS_PROMPT

def configure_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("GEMINI_API_KEY is not set or is invalid in .env")
    genai.configure(api_key=api_key)

async def process_meeting_notes(meeting_notes: str) -> dict:
    try:
        configure_gemini()
        
        # We use a model that supports JSON schema (Gemini 2.5 Flash)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": MeetingResponse
            }
        )
        
        prompt = MEETING_ANALYSIS_PROMPT.format(meeting_notes=meeting_notes)
        
        # Using generate_content
        response = model.generate_content(prompt)
        
        # Parse the JSON response
        response_json = json.loads(response.text)
        return response_json
        
    except Exception as e:
        raise Exception(f"Failed to process meeting notes: {str(e)}")
