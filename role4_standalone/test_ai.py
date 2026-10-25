from talent_check import run_talent_check
from mock_data import sample_candidate, company_benchmarks
from ai_agent import ask_ai_agent_single_question

def main():
    report = run_talent_check(sample_candidate, "Google", company_benchmarks)

    print("Testing real Gemini response...\n")
    answer = ask_ai_agent_single_question(
        report,
        "What are my biggest weaknesses and how can I improve my OS skill?",
    )
    print(answer)


if __name__ == "__main__":
    main()