"""
RADIX Talent Match Hackathon - Role 2 CLI Runner.
Usage:
    python -m app.cli path/to/resume.pdf
"""

import json
import sys
from pathlib import Path

try:
    from app.resume_pipeline import ResumePipeline
except ImportError:
    from backend.app.resume_pipeline import ResumePipeline


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m app.cli <path_to_resume>")
        sys.exit(1)

    resume_path = sys.argv[1]
    pipeline = ResumePipeline()
    profile = pipeline.process_resume(resume_path)
    print(json.dumps(profile, indent=2))


if __name__ == "__main__":
    main()
