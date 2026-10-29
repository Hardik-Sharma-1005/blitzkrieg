"""Command-line entry point for extracting skills from job descriptions."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from fastapi import HTTPException

from .main import (
    MAX_TEXT_CHARS,
    JDResult,
    analyze_with_llm,
    extract_docx,
    extract_pdf,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = PROJECT_ROOT / "output"
MAX_UPLOAD_BYTES = 12 * 1024 * 1024


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract RADIX skills from a PDF or DOCX job description and save the shared JSON handoff."
    )
    parser.add_argument("file", type=Path, help="Path to a job description PDF or DOCX")
    parser.add_argument("--company", default="", help="Optional company name")
    parser.add_argument("--role", default="", help="Optional role title")
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional JSON destination; defaults to output/<JD name>.json",
    )
    return parser.parse_args()


async def run() -> int:
    args = parse_args()
    source = args.file.expanduser().resolve()
    if not source.is_file():
        print(f"File not found: {source}", file=sys.stderr)
        return 2
    suffix = source.suffix.lower()
    if suffix not in {".pdf", ".docx"}:
        print("Please provide a PDF or DOCX file.", file=sys.stderr)
        return 2
    data = source.read_bytes()
    if len(data) > MAX_UPLOAD_BYTES:
        print("The file is over 12 MB. Please use a smaller JD file.", file=sys.stderr)
        return 2

    try:
        if suffix == ".pdf":
            if not data.startswith(b"%PDF"):
                raise ValueError("The file does not appear to be a valid PDF.")
            text, images = extract_pdf(data)
        else:
            if not data.startswith(b"PK"):
                raise ValueError("The file does not appear to be a valid DOCX.")
            text, images = extract_docx(data)
        if not text and not images:
            raise ValueError("No readable text or supported images were found in this file.")
        if len(text) > MAX_TEXT_CHARS:
            raise ValueError("This document is unusually long. Please use a shorter JD copy.")

        extraction = await analyze_with_llm(text, args.company.strip()[:200], args.role.strip()[:200], images)
        result = JDResult(
            source_file=source.name,
            company=args.company.strip()[:200] or extraction.company,
            role=args.role.strip()[:200] or extraction.role,
            skills=extraction.skills,
        )
        destination = args.output.expanduser().resolve() if args.output else OUTPUT_DIR / f"{source.stem}.json"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(
            json.dumps(result.model_dump(mode="json"), ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Saved skill handoff: {destination}")
        return 0
    except HTTPException as exc:
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        print(f"Extraction failed: {detail}", file=sys.stderr)
        return 1
    except (OSError, ValueError) as exc:
        print(f"Extraction failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
