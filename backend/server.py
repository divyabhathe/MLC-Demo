from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from zotgpt_client import ask_zotgpt
from sql_agent import query_for_context


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@app.get("/")
def root():
    return {"status": "MLC Chatbot backend running"}


@app.post("/chat")
async def chat(request: ChatRequest):
    user_message = request.message
    db_context = query_for_context(user_message)

    if db_context:
        enriched_prompt = (
            f"Student asked: {user_message}\n\n"
            f"Relevant data from our database:\n{db_context}\n\n"
            "Use this data to give a direct, data-backed answer. "
            "If the data answers the question, give the numbers or details. "
            "Otherwise give general study tips."
        )
        bot_reply = ask_zotgpt(enriched_prompt)
    else:
        bot_reply = ask_zotgpt(user_message)

    return ChatResponse(response=bot_reply)