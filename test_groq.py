from groq import Groq
import os
from dotenv import load_dotenv

# Load .env from project root
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages = [
    {
        "role": "system",
        "content": "You are a senior Python backend engineer."
    },
    {
        "role": "user",
        "content": "What is FastAPI?"
    },
    {
        "role": "assistant",
        "content": "FastAPI is a modern Python framework."
    },
    {
        "role": "user",
        "content": "How is it different from Django?"
    }
]
    
)

print(response.choices[0].message.content)