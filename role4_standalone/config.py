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
                os.path.join(os.getcwd(), "backend", ".env"),
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

FAST_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
]

def get_gemini_key() -> str:
    candidates = [
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.getcwd(), "backend", ".env"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend", ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "role4_standalone", ".env"),
    ]
    for p in candidates:
        if os.path.exists(p):
            load_dotenv(p)
            val = os.environ.get("GEMINI_API_KEY", "").strip()
            if val:
                return val.strip("'\"")

    return os.environ.get("GEMINI_API_KEY", "").strip().strip("'\"")

def call_gemini_api(prompt: str) -> str:
    """
    Send a prompt to Gemini with ultra-fast sub-2s latency and automatic model fallback.
    """
    api_key = get_gemini_key()
    if not api_key:
        return (
            "[API Error]: No Gemini API key found. Add GEMINI_API_KEY to your "
            "environment or a local .env file."
        )

    preferred_model = os.environ.get("GEMINI_MODEL", "gemini-flash-lite-latest").strip()
    models_to_try = [preferred_model] + [m for m in FAST_MODELS if m != preferred_model]

    last_error = ""
    for model_name in models_to_try:
        try:
            with genai.Client(api_key=api_key) as client:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
            answer = response.text
            if answer and answer.strip():
                return answer.strip()
        except errors.APIError as error:
            last_error = f"Gemini request failed ({error.code}): {error.message}"
            continue
        except httpx.HTTPError as error:
            last_error = f"Unable to connect to Gemini: {error}"
            continue
        except Exception as error:
            last_error = f"Gemini error: {error}"
            continue

    return f"[API Error]: {last_error or 'All fast Gemini models busy.'}"
