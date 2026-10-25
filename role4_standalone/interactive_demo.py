# interactive_demo.py
# Full Step-by-Step Interactive Candidate Experience

from mock_data import sample_candidate, company_benchmarks
from talent_check import run_talent_check
from report_generator import save_report_to_file
from ai_agent import ask_ai_agent_single_question
from interview_practice import generate_interview_questions, evaluate_interview_answer
from skill_proof_sprint import generate_sprint_challenge, evaluate_sprint_submission

def run_interactive_candidate_experience():
    print("\n" + "="*70)
    print("🎯 RADIX TALENT MATCH - INTERACTIVE CANDIDATE EXPERIENCE")
    print("="*70)

    # -------------------------------------------------------------------
    # STEP 1: TALENT CHECK ANALYSIS
    # -------------------------------------------------------------------
    print("\n[STEP 1]: Running Talent Check Engine against Google...")
    report = run_talent_check(sample_candidate, "Google", company_benchmarks)
    
    print("\n" + "-"*50)
    print(f"👤 Candidate Name : {report['candidate_name']}")
    print(f"🏢 Target Company : {report['target_company']}")
    print(f"📊 Readiness Score: {report['readiness_score']}%")
    print(f"🚦 Readiness Status: {'READY FOR HIRING ✅' if report['is_ready'] else 'NOT READY YET ⚠️'}")
    print(f"⚠️ Deal-Breakers  : {report['deal_breakers_count']} major risks found ({report['deal_breakers_list']})")
    print(f"⏱️ Estimated Prep : {report['total_estimated_learning_hours']} total learning hours")
    print("-"*50)

    saved_file = save_report_to_file(report)
    print(f"\n📥 [Download Ready]: Full report saved to '{saved_file}'")

    input("\n👉 Press [ENTER] to move to Step 2: Talk with your Live AI Coach...")

    # -------------------------------------------------------------------
    # STEP 2: INTERACTIVE LIVE AI COACH CHAT
    # -------------------------------------------------------------------
    print("\n" + "="*70)
    print("🤖 STEP 2: LIVE AI CAREER COACH SESSION (POWERED BY GEMINI)")
    print("="*70)
    print("Ask the AI Coach ANY question (e.g. 'How do I improve OS?', 'Give me a study plan').")
    print("Type your question and press Enter. Type 'next' to move to Step 3.\n")

    while True:
        user_q = input("\n💬 You: ").strip()
        if not user_q:
            continue
        if user_q.lower() in ["next", "exit", "skip", "quit"]:
            break

        print("⏳ AI Coach is analyzing your report & generating response...")
        advice = ask_ai_agent_single_question(report, user_q)
        print(f"\n🤖 AI Coach: {advice.strip()}")

    # -------------------------------------------------------------------
    # STEP 3: GAP-BASED INTERVIEW PRACTICE
    # -------------------------------------------------------------------
    print("\n" + "="*70)
    print("🎙️ STEP 3: GAP-BASED INTERVIEW PRACTICE")
    print("="*70)
    print("Generating targeted interview questions based on your top skill gaps...\n")
    
    questions = generate_interview_questions(report)
    target_q = questions[0]

    print(f"[INTERVIEWER QUESTION]:\n\"{target_q}\"\n")
    user_answer = input("📝 Type your interview response: ").strip()

    if user_answer:
        print("\n⏳ Interviewer is evaluating your response...")
        feedback = evaluate_interview_answer(target_q, user_answer)
        print("\n" + "-"*50)
        print("📊 INTERVIEW EVALUATION & FEEDBACK:")
        print("-"*50)
        print(feedback.strip())

    input("\n👉 Press [ENTER] to move to Step 4: Take a Skill Proof Sprint Challenge...")

    # -------------------------------------------------------------------
    # STEP 4: SKILL PROOF SPRINT MICRO-CHALLENGE
    # -------------------------------------------------------------------
    print("\n" + "="*70)
    print("⚡ STEP 4: SKILL PROOF SPRINT (MICRO-CHALLENGE)")
    print("="*70)
    print("Generating a technical challenge for your top gap category...\n")

    challenge = generate_sprint_challenge(report)
    
    print(f"🎯 Challenge Category : {challenge.get('category')}")
    print(f"📌 Title             : {challenge.get('title')}")
    print(f"📖 Scenario          : {challenge.get('scenario')}")
    print(f"🛠️ Your Task         : {challenge.get('task')}\n")

    user_solution = input("💻 Type your technical solution: ").strip()

    if user_solution:
        print("\n⏳ AI Evaluator is grading your solution...")
        sprint_eval = evaluate_sprint_submission(challenge, user_solution)
        
        print("\n" + "-"*50)
        print("🏆 SKILL PROOF SPRINT RESULT:")
        print("-"*50)
        print(f"Status      : {'PASSED ✅' if sprint_eval.get('is_passed') else 'NEEDS WORK ❌'}")
        print(f"Score       : {sprint_eval.get('score_pct')}%")
        print(f"Feedback    : {sprint_eval.get('feedback')}")
        print(f"Skill Badge : '{sprint_eval.get('verified_skill_badge')}'")

    print("\n" + "="*70)
    print("🎉 INTERACTIVE CANDIDATE JOURNEY COMPLETE!")
    print("All results, reports, and badges are ready for Role 3 UI.")
    print("="*70 + "\n")

if __name__ == "__main__":
    run_interactive_candidate_experience()