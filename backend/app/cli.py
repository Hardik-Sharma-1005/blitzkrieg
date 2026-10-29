"""Backward-compatible entry point for the job-description CLI."""

from __future__ import annotations

import asyncio

from .jd_cli import (
    MAX_TEXT_CHARS,
    MAX_UPLOAD_BYTES,
    OUTPUT_DIR,
    PROJECT_ROOT,
    JDResult,
    analyze_with_llm,
    extract_docx,
    extract_pdf,
    parse_args,
    run,
)


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
