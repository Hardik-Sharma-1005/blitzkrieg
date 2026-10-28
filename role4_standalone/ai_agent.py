# ai_agent.py
from config import call_gemini_api

def ask_ai_agent_single_question(talent_check_output: dict, question: str) -> str:
    """
    Live Gemini Career Coach. Answers candidate questions dynamically using report context.
    """
    prompt = f"""
You are RADIX AI — an expert, highly specific, and practical career mentor.

CANDIDATE REPORT SUMMARY:
- Candidate Name: {talent_check_output.get('candidate_name')}
- Target Company: {talent_check_output.get('target_company')}
- Resume skill evidence: {talent_check_output.get('resume_skill_evidence')}
- Company benchmark areas: {talent_check_output.get('per_skillset_gap_breakdown')}

CANDIDATE'S QUESTION: "{question}"

INSTRUCTIONS:
1. Answer the candidate's exact question directly and practically.
2. If they ask about a specific skill (like OS, System Design, or Networking), give concrete topics, resources, or mini-projects to study.
3. Refer to resume evidence and company benchmark data where relevant. Treat resume evidence as a mention, not proof of proficiency.
4. Never label the candidate ready/not ready for hiring, assign a deal-breaker based on a company benchmark, or present inferred levels as demonstrated skill.
4. Keep the response concise, encouraging, and clear (4 to 6 sentences). Do NOT use generic canned greetings.
"""

    response = call_gemini_api(prompt)
    if response.startswith("[API Error]"):
        return talent_check_output.get("ai_candidate_agent_advice", "Review your largest skill gaps and choose one focused next step.")
    if response:
        return response
    else:
        return talent_check_output.get("ai_candidate_agent_advice", "Review your largest skill gaps and choose one focused next step.")
