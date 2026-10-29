# interview_practice.py
import json
from config import call_gemini_api

def generate_interview_questions(talent_check_output: dict) -> list:
    gaps = [item for item in talent_check_output.get("per_skillset_gap_breakdown", []) if item["gap"] > 0]
    focus_category = talent_check_output.get("focus_category")
    if focus_category:
        top_gaps = [focus_category]
    else:
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
    try:
        response = call_gemini_api(prompt)
    except Exception:
        response = ""
    try:
        raw_text = response.strip() if isinstance(response, str) else ""
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


def _fallback_interview_evaluation(question: str, candidate_answer: str, skill_name: str) -> dict:
    """Score locally when an AI provider fails or returns an invalid rubric."""
    answer = candidate_answer.strip()
    words = answer.split()
    normalized_answer = answer.casefold()
    skill_tokens = [token for token in skill_name.casefold().split() if len(token) > 2]
    question_tokens = {token.strip(".,?!:;()[]{}\"'").casefold() for token in question.split()}
    question_tokens = {token for token in question_tokens if len(token) > 3}
    answer_tokens = {token.strip(".,?!:;()[]{}\"'").casefold() for token in words}
    relevant = any(token in normalized_answer for token in skill_tokens) or bool(question_tokens & answer_tokens)
    technical_signals = ("because", "implement", "design", "test", "data", "api", "query", "algorithm", "trade-off", "tradeoff", "performance", "debug", "system", "architecture", "code", "measure")
    evidence_signals = ("for example", "for instance", "I built", "I implemented", "I measured", "result", "improved", "reduced", "increased", "trade-off", "tradeoff", "decided", "tested")
    criteria = {
        "technical_accuracy": 2 if len(words) >= 30 and any(signal in normalized_answer for signal in technical_signals) else 1 if len(words) >= 12 else 0,
        "relevance": 2 if relevant and len(words) >= 20 else 1 if relevant or len(words) >= 12 else 0,
        "explanation": 2 if len(words) >= 35 and any(signal.casefold() in normalized_answer for signal in evidence_signals) else 1 if len(words) >= 12 else 0,
    }
    score = sum(criteria.values())
    passed = criteria["technical_accuracy"] >= 1 and criteria["relevance"] >= 1 and score >= 4
    feedback = (
        "This response was scored with the local rubric because the AI evaluator was unavailable. Add a specific example, explain your technical choices, and describe the outcome for a stronger response."
        if answer else
        "Your response is empty. Add an answer with your approach, a relevant example, and the result before submitting."
    )
    return {
        "is_passed": passed,
        "score_pct": round(score / 6 * 100),
        "criteria": criteria,
        "feedback": feedback,
        "evaluation_status": "scored",
        "evaluation_method": "local_fallback",
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
    try:
        response = call_gemini_api(prompt)
    except Exception:
        response = ""
    try:
        raw_text = response.strip() if isinstance(response, str) else ""
        if "```" in raw_text:
            raw_text = raw_text.split("```", 1)[1].replace("json", "", 1).strip().removesuffix("```").strip()
        data = json.loads(raw_text)
        keys = ("technical_accuracy", "relevance", "explanation")
        if isinstance(data, dict) and all(type(data.get(key)) is int and 0 <= data[key] <= 2 for key in keys) and isinstance(data.get("feedback"), str) and data["feedback"].strip():
            score = sum(data[key] for key in keys)
            passed = data["technical_accuracy"] >= 1 and data["relevance"] >= 1 and score >= 4
            return {
                "is_passed": passed,
                "score_pct": round(score / 6 * 100),
                "criteria": {key: data[key] for key in keys},
                "feedback": data["feedback"][:1200],
                "evaluation_status": "scored",
                "evaluation_method": "ai",
            }
    except (ValueError, TypeError, IndexError):
        pass
    return _fallback_interview_evaluation(question, candidate_answer, skill_name)
