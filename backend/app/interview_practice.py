# interview_practice.py
import json
try:
    from .config import call_gemini_api
except ImportError:
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
    if response:
        return response
    return "Good effort! Make sure to include specific technical metrics and use the STAR method."