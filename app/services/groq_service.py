import os
import tempfile
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

async def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    """
    Send audio bytes to Groq Whisper and get back raw transcript text.
    We write to a temp file because Groq SDK expects a file object.
    """
    suffix = os.path.splitext(filename)[1]  # get .mp3, .wav, etc.

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
                response_format="text"
            )
        return response
    finally:
        os.unlink(tmp_path)  # always delete temp file, even if error occurs


async def summarize_transcript(transcript: str) -> dict:
    """
    Send transcript to LLaMA and get back structured summary + action items.
    """
    prompt = f"""
You are an expert meeting analyst. Analyze this meeting transcript and return ONLY a JSON object with no extra text.

Transcript:
{transcript}

Return this exact JSON structure:
{{
    "summary": "2-3 sentence overview of what the meeting was about",
    "key_points": ["point 1", "point 2", "point 3"],
    "action_items": [
        {{"task": "what needs to be done", "owner": "who is responsible (Unknown if not mentioned)", "deadline": "when (Unknown if not mentioned)"}}
    ],
    "meeting_sentiment": "positive/neutral/negative"
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1  # low temperature = more consistent, structured output
    )

    import json
    raw = response.choices[0].message.content.strip()

    # strip markdown code blocks if model wraps response in ```json ... ```
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    return json.loads(raw)