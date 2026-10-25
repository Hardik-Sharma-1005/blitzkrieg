# config.py
import os

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(dotenv_path=None, **kwargs):
        """Pure-Python fallback when python-dotenv is not installed."""
        if dotenv_path is None:
            candidates = [
                os.path.join(os.getcwd(), ".env"),
                os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
                os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
            ]
            for p in candidates:
                if os.path.exists(p):
                    dotenv_path = p
                    break
        if not dotenv_path or not os.path.exists(dotenv_path):
            return False
        try:
            with open(dotenv_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip("'\""))
            return True
        except Exception:
            return False

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
