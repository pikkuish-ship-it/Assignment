import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="OpsFlow AI - Internal Operations Assistant")

# Mount static files (CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routes
app.include_router(router)
