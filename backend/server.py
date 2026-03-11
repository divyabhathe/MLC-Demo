from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from zotgpt_client import ask_zotgpt


app = FastAPI()


#Enable CORS so the React frontend can call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#Request format expected from frontend
class ChatRequest(BaseModel):
    message: str


#Response format returned to frontend
class ChatResponse(BaseModel):
    response: str


@app.get("/")
def root():
    return {"status": "MLC Chatbot backend running"}


@app.post("/chat")
async def chat(request: ChatRequest):
    user_message = request.message

    bot_reply = ask_zotgpt(user_message)

    return ChatResponse(response=bot_reply)