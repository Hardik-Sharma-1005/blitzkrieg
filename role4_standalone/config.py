# config.py
import os
import sys
from pathlib import Path

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
from google.genai import errors, types
import httpx

_BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))
try:
    from app.llm_extractor import get_ai_provider_configs
except ImportError:
    get_ai_provider_configs = lambda: []

def get_gemini_key() -> str:
    load_dotenv(Path(__file__).with_name(".env"), override=False)
    load_dotenv(_BACKEND_DIR / ".env", override=False)
    return os.environ.get("GEMINI_API_KEY", "").strip()

def call_gemini_api(prompt: str) -> str:
    """
    Try Gemini first, then the configured OpenRouter/OpenAI providers.
    Each provider gets a bounded request with no hidden retries.
    """
    api_key = get_gemini_key()
    model_name = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash").strip()
    failures = []
    try:
        if not api_key:
            failures.append("Gemini key is not configured")
        elif not model_name:
            failures.append("Gemini model is not configured")
        else:
            http_options = types.HttpOptions(
                timeout=30_000,
                retry_options=types.HttpRetryOptions(attempts=1),
            )
            with genai.Client(api_key=api_key, http_options=http_options) as client:
                response = client.models.generate_content(model=model_name, contents=prompt)
            answer = (response.text or "").strip()
            if answer:
                return answer
            failures.append("Gemini returned an empty response")
    except errors.APIError as error:
        failures.append(f"Gemini returned HTTP {error.code}")
    except (httpx.HTTPError, TimeoutError, OSError) as error:
        failures.append(f"Gemini connection failed ({type(error).__name__})")

    for provider in get_ai_provider_configs():
        name = provider.get("provider", "backup provider")
        try:
            headers = {"Authorization": "Bearer " + provider["api_key"]}
            if name == "openrouter":
                headers.update({"HTTP-Referer": "http://localhost:5173", "X-Title": "RADIX Talent Match"})
            with httpx.Client(timeout=httpx.Timeout(30, connect=8)) as client:
                response = client.post(
                    provider["base_url"].rstrip("/") + "/chat/completions",
                    headers=headers,
                    json={
                        "model": provider["model"],
                        "temperature": 0.2,
                        "max_tokens": 1200,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                response.raise_for_status()
            answer = response.json()["choices"][0]["message"]["content"]
            if isinstance(answer, str) and answer.strip():
                return answer.strip()
            failures.append(f"{name} returned an empty response")
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, OSError) as error:
            status = getattr(getattr(error, "response", None), "status_code", None)
            failures.append(f"{name} failed" + (f" (HTTP {status})" if status else f" ({type(error).__name__})"))

    return "[API Error]: AI generation failed across configured providers: " + "; ".join(failures)
