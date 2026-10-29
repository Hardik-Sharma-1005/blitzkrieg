"""Temporary, page-scoped OCR for scanned PDF documents via configured vision models."""

from __future__ import annotations

import base64
import json
from io import BytesIO
from typing import Any

import httpx
from PIL import ImageOps

try:
    from .llm_extractor import get_ai_provider_configs
except ImportError:
    from backend.app.llm_extractor import get_ai_provider_configs


def _page_data_url(bitmap: Any) -> str:
    image = ImageOps.exif_transpose(bitmap.to_pil()).convert("RGB")
    image.thumbnail((1800, 1800))
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=82, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def transcribe_document_images(images: list[dict[str, str]]) -> str:
    """Transcribe supported embedded or rendered document images in memory."""
    providers = get_ai_provider_configs()
    if not images or not providers:
        return ""
    transcribed: list[str] = []
    for image in images:
        payload = {
            "temperature": 0,
            "max_tokens": 5000,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Transcribe readable text visible in this supplied document image. "
                        "Do not summarize, infer, or add text. Preserve spelling and punctuation. "
                        'Return JSON only: {"text":"verbatim transcription"}.'
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Transcribe source {image['label']}."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image["data_url"],
                                "detail": "high",
                            },
                        },
                    ],
                },
            ],
        }
        for provider in providers:
            headers = {"Authorization": f"Bearer {provider['api_key']}"}
            if provider["provider"] == "openrouter":
                headers.update(
                    {
                        "HTTP-Referer": "http://localhost:5173",
                        "X-Title": "RADIX Talent Match",
                    }
                )
            try:
                with httpx.Client(timeout=httpx.Timeout(35, connect=8)) as client:
                    response = client.post(
                        provider["base_url"] + "/chat/completions",
                        headers=headers,
                        json={**payload, "model": provider["model"]},
                    )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                text = json.loads(content).get("text", "")
                if isinstance(text, str) and text.strip():
                    transcribed.append(f"[{image['label']} transcription]\n{text.strip()}")
                    break
            except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError):
                continue
    return "\n\n".join(transcribed)


def extract_scanned_pdf_pages(data: bytes, page_indexes: list[int]) -> dict[int, str]:
    """Transcribe image-only/low-text pages without persisting their content."""
    if not page_indexes:
        return {}
    providers = get_ai_provider_configs()
    if not providers:
        return {}

    try:
        import pypdfium2 as pdfium
    except ImportError as exc:
        raise RuntimeError("PDFium is required to read scanned PDF pages.") from exc

    document = pdfium.PdfDocument(data)
    results: dict[int, str] = {}
    try:
        for page_index in page_indexes:
            page = document[page_index]
            try:
                image_url = _page_data_url(page.render(scale=1.8))
            finally:
                page.close()

            payload = {
                "temperature": 0,
                "max_tokens": 5000,
                "response_format": {"type": "json_object"},
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "Transcribe all readable text visible in the supplied document page. "
                            "Do not summarize, infer, or add text. Preserve spelling and punctuation. "
                            "For columns, transcribe each column top to bottom, from left to right. "
                            'Return JSON only: {"text":"verbatim transcription"}.'
                        ),
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"Transcribe page {page_index + 1}."},
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url, "detail": "high"},
                            },
                        ],
                    },
                ],
            }
            for provider in providers:
                headers = {"Authorization": f"Bearer {provider['api_key']}"}
                if provider["provider"] == "openrouter":
                    headers.update(
                        {
                            "HTTP-Referer": "http://localhost:5173",
                            "X-Title": "RADIX Talent Match",
                        }
                    )
                try:
                    with httpx.Client(timeout=httpx.Timeout(35, connect=8)) as client:
                        response = client.post(
                            provider["base_url"] + "/chat/completions",
                            headers=headers,
                            json={**payload, "model": provider["model"]},
                        )
                    response.raise_for_status()
                    content = response.json()["choices"][0]["message"]["content"]
                    transcription = json.loads(content).get("text", "")
                    if isinstance(transcription, str) and transcription.strip():
                        results[page_index] = transcription.strip()
                        break
                except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError):
                    continue
    finally:
        document.close()
    return results
