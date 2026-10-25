# config.py
import os

from dotenv import load_dotenv
from google import genai
from google.genai import errors
import httpx

def get_gemini_key() -> str:
    load_dotenv()
    return os.environ.get("GEMINI_API_KEY", "").strip()

def call_gemini_api(prompt: str) -> str:
    """
    Send a prompt to the configured Gemini model and return its text response.
    """
    api_key = get_gemini_key()
    if not api_key:
        return (
            "[API Error]: No Gemini API key found. Add GEMINI_API_KEY to your "
            "environment or a local .env file."
        )

    model_name = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash").strip()
    if not model_name:
        return "[API Error]: GEMINI_MODEL is empty. Set it to an available Gemini model."

    try:
        with genai.Client(api_key=api_key) as client:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
    except errors.APIError as error:
        return f"[API Error]: Gemini request failed ({error.code}): {error.message}"
    except httpx.HTTPError as error:
        return f"[API Error]: Unable to connect to Gemini: {error}"

    answer = response.text
    if not answer or not answer.strip():
        return "[API Error]: Gemini returned an empty response."
    return answer.strip()