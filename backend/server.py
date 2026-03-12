"""
server.py — FastAPI routing and CORS for MLC backend.

Serves the /chat endpoint that the Next.js frontend (port 3000) calls.
CORS is enabled to allow requests from the frontend.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import run_query

app = FastAPI(title="MLC Backend", version="0.1.0")

# Allow frontend (Next.js on port 3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@app.get("/health")
def health():
    """Health check endpoint for debugging."""
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """
    Receives the student's message and returns database-backed info.
    """

    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Example query (pull some users)
    db_result = run_query("SELECT id, name FROM users LIMIT 5;")

    return ChatResponse(
        response=f"You said: '{request.message}'.\n\nDatabase sample:\n{db_result}"
    )