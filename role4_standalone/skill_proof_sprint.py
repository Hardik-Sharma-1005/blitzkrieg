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


def generate_profile_sprint_challenge(skill_name: str, category: str, resume_evidence: str = "") -> dict:
    prompt = f"""
Create one short applied skill challenge for a student to demonstrate {skill_name} ({category}).
Use this resume evidence only as context: "{resume_evidence[:700]}".
Return ONLY a valid JSON object with these exact keys:
{{"title": "Short title", "scenario": "Brief realistic scenario", "task": "Specific task with a clear expected response"}}
"""
    response = call_gemini_api(prompt)
    try:
        raw_text = response.strip()
        if "```" in raw_text:
            raw_text = raw_text.split("```", 1)[1].replace("json", "", 1).strip().removesuffix("```").strip()
        data = json.loads(raw_text)
        if isinstance(data, dict) and all(isinstance(data.get(key), str) and data[key].strip() for key in ("title", "scenario", "task")):
            return {**data, "category": category, "skill_name": skill_name, "generation_status": "available"}
    except (ValueError, TypeError, IndexError):
        pass
    return {
        "title": f"{skill_name} applied challenge",
        "scenario": f"A project needs a practical solution that uses {skill_name}.",
        "task": f"Describe how you would solve the problem using {skill_name}. Include your approach, one important trade-off, and how you would validate the result.",
        "category": category,
        "skill_name": skill_name,
        "generation_status": "fallback",
    }

def evaluate_sprint_submission(challenge: dict, solution: str) -> dict:
    cat = challenge.get("category", "General")
    task = challenge.get("task", "")

    prompt = f"""
Evaluate the candidate solution for task: "{task}".
Rate each criterion as an integer from 0 to 2:
- correctness: technically sound and relevant to the task
- feasibility: a practical approach with reasonable trade-offs
- completeness: enough detail to carry out and validate the solution

Return ONLY JSON with these exact keys:
{{"correctness": 0, "feasibility": 0, "completeness": 0, "feedback": "2 concise sentences of constructive evaluation"}}

CANDIDATE SOLUTION: "{solution[:12000]}"
"""

    response = call_gemini_api(prompt)
    if response.startswith("[API Error]"):
        return {
            "is_passed": False,
            "score_pct": 0,
            "criteria": {},
            "feedback": "AI evaluation is temporarily unavailable. Your submission was received but was not scored or marked as passed. Please retry when the AI service is available.",
            "verified_skill_badge": "",
            "evaluation_status": "unavailable",
        }
    try:
        raw_text = response.strip()
        if "```" in raw_text:
            raw_text = raw_text.split("```")[1].replace("json", "").strip()
        data = json.loads(raw_text)
        criteria = ("correctness", "feasibility", "completeness")
        if isinstance(data, dict) and all(type(data.get(key)) is int and 0 <= data[key] <= 2 for key in criteria) and isinstance(data.get("feedback"), str):
            score = sum(data[key] for key in criteria)
            passed = all(data[key] >= 1 for key in criteria) and score >= 4
            return {
                "is_passed": passed,
                "score_pct": round(score / 6 * 100),
                "criteria": {key: data[key] for key in criteria},
                "feedback": data["feedback"][:1200],
                "verified_skill_badge": f"{challenge.get('skill_name') or cat} badge" if passed else "",
                "evaluation_status": "scored",
            }
    except Exception:
        pass

    return {
        "is_passed": False,
        "score_pct": 0,
        "criteria": {},
        "feedback": "The AI response could not be validated. Your submission was not scored or marked as passed; please retry.",
        "verified_skill_badge": "",
        "evaluation_status": "unavailable",
    }
