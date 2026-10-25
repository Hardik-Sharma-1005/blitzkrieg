# skill_proof_sprint.py
import json
from config import call_gemini_api

def generate_sprint_challenge(talent_check_output: dict) -> dict:
    gaps = [item for item in talent_check_output.get("per_skillset_gap_breakdown", []) if item["gap"] > 0]
    cat = gaps[0]["category"] if gaps else "COD"

    prompt = f"""
Create a 3-minute technical micro-challenge for category '{cat}'.
Return ONLY a valid JSON object with these exact keys:
{{
    "category": "{cat}",
    "title": "Short title",
    "scenario": "Problem description",
    "task": "Specific solution task for the candidate"
}}
"""

    response = call_gemini_api(prompt)
    try:
        raw_text = response.strip()
        if "```" in raw_text:
            raw_text = raw_text.split("```")[1].replace("json", "").strip()
        data = json.loads(raw_text)
        if isinstance(data, dict) and "task" in data:
            return data
    except Exception:
        pass

    return {
        "category": cat,
        "title": f"Micro-Sprint: {cat} Architecture",
        "scenario": f"High database latency in the {cat} microservice during traffic spikes.",
        "task": "Propose 2 architectural solutions (e.g., caching layer, async queues) to solve the latency."
    }

def evaluate_sprint_submission(challenge: dict, solution: str) -> dict:
    cat = challenge.get("category", "General")
    task = challenge.get("task", "")

    prompt = f"""
Evaluate this candidate solution for task: "{task}".
CANDIDATE SOLUTION: "{solution}"

Return ONLY a valid JSON object with these exact keys:
{{
    "is_passed": true,
    "score_pct": 85,
    "feedback": "2 sentences of constructive evaluation",
    "verified_skill_badge": "Verified Evidence: {cat} Applied Practice"
}}
"""

    response = call_gemini_api(prompt)
    if response.startswith("[API Error]"):
        return {
            "is_passed": False,
            "score_pct": 0,
            "feedback": "AI evaluation is temporarily unavailable. Your submission was received but was not scored or marked as passed. Please retry when the AI service is available.",
            "verified_skill_badge": "",
            "evaluation_status": "unavailable",
        }
    try:
        raw_text = response.strip()
        if "```" in raw_text:
            raw_text = raw_text.split("```")[1].replace("json", "").strip()
        data = json.loads(raw_text)
        if isinstance(data, dict) and "is_passed" in data:
            return data
    except Exception:
        pass

    return {
        "is_passed": False,
        "score_pct": 0,
        "feedback": "The AI response could not be validated. Your submission was not scored or marked as passed; please retry.",
        "verified_skill_badge": "",
        "evaluation_status": "unavailable",
    }
