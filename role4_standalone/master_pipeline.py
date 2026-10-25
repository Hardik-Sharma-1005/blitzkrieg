# master_pipeline.py
# Complete Candidate Journey Pipeline for RADIX Talent Match

import json
from mock_data import sample_candidate, company_benchmarks
from talent_check import run_talent_check, get_radar_chart_data
from report_generator import save_report_to_file
from ai_agent import ask_ai_agent_single_question
from interview_practice import generate_interview_questions, evaluate_interview_answer
from skill_proof_sprint import generate_sprint_challenge, evaluate_sprint_submission

def run_candidate_journey():
    print("="*65)
    print("🚀 RADIX TALENT MATCH - FULL CANDIDATE EXPERIENTIAL FLOW")
    print("="*65)

    # ---------------------------------------------------------------
    # STAGE 1: Talent Check Math Engine
    # ---------------------------------------------------------------
    print("\n[STAGE 1]: Running Talent Check Engine against Google...")
    report = run_talent_check(sample_candidate, "Google", company_benchmarks)
    radar = get_radar_chart_data(report)
    
    print(f"  > Candidate Name  : {report['candidate_name']}")
    print(f"  > Readiness Score : {report['readiness_score']}%")
    print(f"  > Ready Status    : {'READY ✅' if report['is_ready'] else 'NOT READY YET ⚠️'}")
    print(f"  > Deal-Breakers   : {report['deal_breakers_count']} found ({report['deal_breakers_list']})")
    print(f"  > Est. Prep Time  : {report['total_estimated_learning_hours']} hours")

    # ---------------------------------------------------------------
    # STAGE 2: Downloadable Report Generation
    # ---------------------------------------------------------------
    print("\n[STAGE 2]: Generating Downloadable Readiness Report...")
    saved_filename = save_report_to_file(report)
    print(f"  > Report successfully saved as: '{saved_filename}'")

    # ---------------------------------------------------------------
    # STAGE 3: AI Candidate Coach Response
    # ---------------------------------------------------------------
    print("\n[STAGE 3]: Connecting Candidate to AI Career Coach...")
    ai_response = ask_ai_agent_single_question(report, "What is my single most urgent priority?")
    print(f"  > AI Coach: \"{ai_response.strip()}\"")

    # ---------------------------------------------------------------
    # STAGE 4: Gap-Based Interview Practice
    # ---------------------------------------------------------------
    print("\n[STAGE 4]: Generating Targeted Interview Questions...")
    questions = generate_interview_questions(report)
    print(f"  > Q1 Generated: \"{questions[0]}\"")
    
    sample_answer = "I would place Redis in front of PostgreSQL for read-heavy caching and use horizontal sharding for scale."
    feedback = evaluate_interview_answer(questions[0], sample_answer)
    print(f"  > Feedback Received:\n{feedback.strip()}")

    # ---------------------------------------------------------------
    # STAGE 5: Skill Proof Sprint (Micro-Challenge)
    # ---------------------------------------------------------------
    print("\n[STAGE 5]: Generating Skill Proof Sprint Micro-Challenge...")
    challenge = generate_sprint_challenge(report)
    print(f"  > Sprint Category: {challenge.get('category')}")
    print(f"  > Task           : {challenge.get('task')}")
    
    solution = "Use distributed caching and asynchronous queue workers to handle bottleneck spikes."
    sprint_result = evaluate_sprint_submission(challenge, solution)
    print(f"  > Sprint Result  : Passed={sprint_result.get('is_passed')}, Score={sprint_result.get('score_pct')}%")
    print(f"  > Skill Badge    : '{sprint_result.get('verified_skill_badge')}'")

    print("\n" + "="*65)
    print("🎉 FULL CANDIDATE JOURNEY PIPELINE COMPLETED SUCCESSFULLY!")
    print("="*65)

if __name__ == "__main__":
    run_candidate_journey()