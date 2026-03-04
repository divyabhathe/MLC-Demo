This directory is the dedicated space for the Python/FastAPI logic. The frontend is currently running on Next.js (Port 3000) and is configured to send requests to this service.

Environment Setup:
Use Python 3.10+.
Install dependencies: pip install -r requirements.txt.

Start the Server:
Run the FastAPI app: uvicorn server:app --reload --port 8000.
🔌 API Contract (Frontend ↔ Backend)
The frontend ChatUI.jsx component is pre-configured to communicate with the following endpoint:

Endpoint: POST http://localhost:8000/chat

Request Body:

JSON
{
  "message": "Student's question here"
}
Expected Response:

JSON
{
  "response": "AI-generated advice based on past student data"
}
📂 File Responsibilities
Based on Mani's architecture plan:

server.py: Handles FastAPI routing and CORS.

sql_agent.py: Contains the logic for converting natural language into SQL queries.

zotgpt_client.py: Manages the connection to the LLM (ZotGPT).

database.py: Connects to the student insight database.

../prompts/: Contains .txt templates for steering the AI's persona.

⚠️ Important: CORS
The Python server must have CORS enabled to allow requests from the Next.js frontend (Port 3000), or the browser will block the chat messages.