"""
server.py — FastAPI routing and CORS for MLC backend.

Serves the /chat endpoint that the Next.js frontend (port 3000) calls.
CORS is enabled to allow requests from the frontend.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    Receives the student's message and returns AI-generated advice.
    Currently returns a placeholder; will be wired to zotgpt_client later.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Placeholder: echo back until zotgpt_client is integrated
    return ChatResponse(
        response=f"I received your message: \"{request.message}\". "
        "The ZotGPT integration is not set up yet."
    )
