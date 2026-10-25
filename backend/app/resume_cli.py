"""Parse one resume and print its structured candidate profile as JSON."""

import json
import sys
from pathlib import Path

from .resume_pipeline import ResumePipeline


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python -m app.resume_cli <resume.pdf|resume.docx>", file=sys.stderr)
        return 2

    source = Path(sys.argv[1]).expanduser().resolve()
    if not source.is_file():
        print(f"Resume not found: {source}", file=sys.stderr)
        return 2

    try:
        profile = ResumePipeline().process_resume(str(source))
    except (OSError, ValueError) as exc:
        print(f"Resume parsing failed: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(profile, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
