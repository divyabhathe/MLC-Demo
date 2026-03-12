from openai import AzureOpenAI

AZURE_API_KEY = "8587643a52004705b729bc6528b3c799"
AZURE_ENDPOINT = "https://azureapi.zotgpt.uci.edu/"
API_VERSION = "2024-02-01"

client = AzureOpenAI(
    api_key=AZURE_API_KEY,
    api_version=API_VERSION,
    azure_endpoint=AZURE_ENDPOINT,
)


def ask_zotgpt(prompt: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are the My Learning Coach chatbot helping students improve their study habits."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7
        )

        return response.choices[0].message.content
    
    except Exception as e:
        print("Azure OpenAI error:", e)
        return "Sorry, I was unable to reach the AI service."