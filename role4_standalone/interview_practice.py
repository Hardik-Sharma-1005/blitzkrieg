# interview_practice.py
import json
from config import call_gemini_api

def generate_interview_questions(talent_check_output: dict) -> list:
    gaps = [item for item in talent_check_output.get("per_skillset_gap_breakdown", []) if item["gap"] > 0]
    top_gaps = [g["category"] for g in gaps[:2]] if gaps else ["General Software Engineering"]
    company = talent_check_output.get("target_company", "Google")

    prompt = f"""
You are a senior tech interviewer for {company}.
The candidate has identified skill gaps in: {', '.join(top_gaps)}.

Generate 2 technical/behavioral interview questions designed to test these gap areas.
Return ONLY a valid JSON list of 2 string questions, formatted like this:
["Question 1...", "Question 2..."]
"""

    response = call_gemini_api(prompt)
    try:
        raw_text = response.strip()
        if "```" in raw_text:
            raw_text = raw_text.split("```")[1].replace("json", "").strip()
        questions = json.loads(raw_text)
        if isinstance(questions, list) and len(questions) >= 1:
            return questions
    except Exception:
        pass

    return [
        f"How would you design a high-throughput, fault-tolerant service? (Focusing on {top_gaps[0]})",
        f"Describe a time you faced a major technical gap on a project. How did you resolve it?"
    ]

def evaluate_interview_answer(question: str, candidate_answer: str) -> str:
    prompt = f"""
You are an expert technical interviewer evaluating a candidate's answer.

INTERVIEW QUESTION: "{question}"
CANDIDATE ANSWER: "{candidate_answer}"

Provide concise feedback with 3 bullet points:
1. Strengths of their response.
2. Technical gaps or missing details.
3. Actionable tip to structure the answer using the STAR method (Situation, Task, Action, Result).
"""

    response = call_gemini_api(prompt)
    if response.startswith("[API Error]"):
        return "AI feedback is temporarily unavailable. Review whether your answer includes a clear situation, your specific action, technical trade-offs, and the result."
    if response:
        return response
    return "Good effort! Make sure to include specific technical metrics and use the STAR method."


def generate_profile_interview_question(skill_name: str, category: str, resume_evidence: str = "") -> dict:
    prompt = f"""
Write one focused interview question to assess the candidate's applied understanding of {skill_name} ({category}).
Use the resume evidence only as context, not as proof of skill: "{resume_evidence[:700]}".
Return ONLY JSON: {{"question": "..."}}
"""
    response = call_gemini_api(prompt)
    try:
        raw_text = response.strip()
        if "```" in raw_text:
            raw_text = raw_text.split("```", 1)[1].replace("json", "", 1).strip().removesuffix("```").strip()
        data = json.loads(raw_text)
        if isinstance(data, dict) and isinstance(data.get("question"), str) and data["question"].strip():
            return {"question": data["question"].strip(), "generation_status": "available"}
    except (ValueError, TypeError, IndexError):
        pass
    return {
        "question": f"Describe a specific problem where you applied {skill_name}. What approach did you choose, what alternatives did you consider, and how did you know your solution worked?",
        "generation_status": "fallback",
    }


def evaluate_profile_interview_answer(question: str, candidate_answer: str, skill_name: str) -> dict:
    prompt = f"""
Evaluate the candidate's answer for the skill {skill_name} using this rubric. Rate each criterion from 0 to 2:
- technical_accuracy: correct understanding and technically sound reasoning
- relevance: directly addresses the question with specific evidence or examples
- explanation: explains decisions and outcomes clearly

Return ONLY JSON with integer criterion scores and concise feedback:
{{"technical_accuracy": 0, "relevance": 0, "explanation": 0, "feedback": "..."}}

QUESTION: {question[:3000]}
ANSWER: {candidate_answer[:12000]}
"""
    response = call_gemini_api(prompt)
    if response.startswith("[API Error]"):
        return {
            "is_passed": False,
            "score_pct": 0,
            "criteria": {},
            "feedback": "Assessment is temporarily unavailable. Your answer was not scored and no badge was awarded. Please try again later.",
            "evaluation_status": "unavailable",
        }
    try:
        raw_text = response.strip()
        if "```" in raw_text:
            raw_text = raw_text.split("```", 1)[1].replace("json", "", 1).strip().removesuffix("```").strip()
        data = json.loads(raw_text)
        keys = ("technical_accuracy", "relevance", "explanation")
        if isinstance(data, dict) and all(type(data.get(key)) is int and 0 <= data[key] <= 2 for key in keys) and isinstance(data.get("feedback"), str):
            score = sum(data[key] for key in keys)
            passed = data["technical_accuracy"] >= 1 and data["relevance"] >= 1 and score >= 4
            return {
                "is_passed": passed,
                "score_pct": round(score / 6 * 100),
                "criteria": {key: data[key] for key in keys},
                "feedback": data["feedback"][:1200],
                "evaluation_status": "scored",
            }
    except (ValueError, TypeError, IndexError):
        pass
    return {
        "is_passed": False,
        "score_pct": 0,
        "criteria": {},
        "feedback": "The answer could not be scored reliably. No badge was awarded; please try again when assessment is available.",
        "evaluation_status": "unavailable",
    }
