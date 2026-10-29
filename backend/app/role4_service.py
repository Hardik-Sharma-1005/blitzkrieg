"""Adapters that expose Vansh's standalone Role 4 workflow to the web app."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

ROLE4_DIR = Path(__file__).resolve().parents[2] / "Talent Check"
if str(ROLE4_DIR) not in sys.path:
    sys.path.insert(0, str(ROLE4_DIR))

from ai_agent import ask_ai_agent_single_question
from interview_practice import (
    evaluate_interview_answer,
    evaluate_profile_interview_answer,
    generate_interview_questions,
    generate_profile_interview_question,
)
from report_generator import generate_markdown_report
from skill_proof_sprint import evaluate_sprint_submission, generate_profile_sprint_challenge, generate_sprint_challenge

__all__ = [
    "ask_ai_agent_single_question",
    "evaluate_interview_answer",
    "evaluate_profile_interview_answer",
    "evaluate_sprint_submission",
    "generate_interview_questions",
    "generate_profile_interview_question",
    "generate_profile_sprint_challenge",
    "generate_markdown_report",
    "generate_sprint_challenge",
]


def ensure_report(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or value.get("error"):
        raise ValueError("Run a successful Talent Check before continuing.")
    return value
