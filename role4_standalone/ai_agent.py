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
- Readiness Score: {talent_check_output.get('readiness_score')}%
- Deal Breakers: {talent_check_output.get('deal_breakers_list')}
- Learning Hours Needed: {talent_check_output.get('total_estimated_learning_hours')}
- Top ROI Skill to Improve: {talent_check_output.get('what_if_recommendation')}
- Complete Skill Gap Breakdown: {talent_check_output.get('per_skillset_gap_breakdown')}

CANDIDATE'S QUESTION: "{question}"

INSTRUCTIONS:
1. Answer the candidate's exact question directly and practically.
2. If they ask about a specific skill (like OS, System Design, or Networking), give concrete topics, resources, or mini-projects to study.
3. Reference their actual gap numbers or company requirements where relevant.
4. Keep the response concise, encouraging, and clear (4 to 6 sentences). Do NOT use generic canned greetings.
"""

    response = call_gemini_api(prompt)
    if response:
        return response
    else:
        return talent_check_output.get("ai_candidate_agent_advice", "AI Coach unavailable.")