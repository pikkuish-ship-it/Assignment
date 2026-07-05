import os
import requests
import datetime
from fastapi import HTTPException
from dotenv import load_dotenv

def send_to_webhook(payload: dict) -> dict:
    load_dotenv(override=True)
    webhook_url = os.getenv("N8N_WEBHOOK")
    
    if not webhook_url or webhook_url == "https://your-n8n-url/webhook/meeting":
        raise HTTPException(status_code=500, detail="N8N_WEBHOOK is not configured properly in .env")
    
    # Add timestamp
    payload["generated_at"] = datetime.datetime.utcnow().isoformat()
    
    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        
        # Raise an exception for bad status codes
        response.raise_for_status()
        
        return {"status": "success", "message": "Successfully sent to n8n."}
        
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Connection to n8n webhook timed out.")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=502, detail="Failed to connect to the n8n webhook. Is it running?")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with n8n webhook: {str(e)}")
