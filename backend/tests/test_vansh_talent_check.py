import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path
import sys
import tempfile

import httpx

from backend.app import main
from backend.app.mock_data import RADIX_CATEGORIES, company_benchmark_metadata, company_benchmarks_by_id
from backend.app.resume_pipeline import ResumePipeline
from backend.app.schemas import CandidateProfile
from docx import Document

ROLE4_DIR = Path(__file__).resolve().parents[2] / "role4_standalone"
sys.path.insert(0, str(ROLE4_DIR))
import config as role4_config


class VanshTalentCheckWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.profile = {
            "name": "Synthetic Student",
            "skills": [
                {"skill_name": "Python", "category_code": "COD", "confidence": "high"},
                {"skill_name": "SQL", "category_code": "SQL", "confidence": "medium"},
            ],
        }

    def test_company_directory_contains_118_profiles_and_12_radix_categories(self):
        result = main.get_talent_check_companies()
        self.assertEqual(len(result["companies"]), 118)
        self.assertEqual(result["radix_skill_count"], 12)
        self.assertEqual(len(RADIX_CATEGORIES), 12)
        self.assertEqual(len({entry["company_id"] for entry in result["companies"]}), 118)

    def test_company_specific_and_radix_fallback_profiles_each_score_12_skills(self):
        for company_id, expected_source in ((1, "company_skill_levels"), (1002, "radix_median_fallback")):
            with self.subTest(company_id=company_id):
                result = main.score_talent_check(main.TalentCheckRequest(
                    candidate_profile=self.profile,
                    company_id=company_id,
                ))
                report = result["report"]
                self.assertEqual(report["company_id"], company_id)
                self.assertEqual(report["benchmark_source"], expected_source)
                self.assertEqual(len(report["per_skillset_gap_breakdown"]), 12)
                self.assertEqual(
                    {item["category"] for item in report["per_skillset_gap_breakdown"]},
                    set(RADIX_CATEGORIES),
                )
                self.assertEqual(len(result["radar_chart_data"]), 12)

    def test_resume_confidence_maps_to_score_and_additional_skills_add_point_two(self):
        from backend.app.talent_check import normalize_candidate_skills

        normalized = normalize_candidate_skills({"skills": [
            {"skill_name": "Python", "category_code": "COD", "confidence": "high"},
            {"skill_name": "Django", "category_code": "COD", "confidence": "high"},
            {"skill_name": "SQL", "category_code": "SQL", "confidence": "medium"},
            {"skill_name": "Networking", "category_code": "NETW", "confidence": "low"},
        ]})
        by_category = {skill["category_code"]: skill["level"] for skill in normalized["skills"]}
        self.assertEqual(by_category["COD"], 4.0)
        self.assertEqual(by_category["SQL"], 2.8)
        self.assertEqual(by_category["NETW"], 1.8)

    def test_gap_at_least_one_point_five_is_a_deal_breaker_regardless_of_weight(self):
        benchmark = {category: 2.0 for category in RADIX_CATEGORIES}
        report = main.run_talent_check({}, "Synthetic benchmark", {"Synthetic benchmark": benchmark})
        self.assertEqual(report["deal_breakers_count"], len(RADIX_CATEGORIES))
        self.assertTrue(all(row["is_deal_breaker"] and row["gap"] == 2.0 for row in report["per_skillset_gap_breakdown"]))
        self.assertFalse(report["is_ready"])

    def test_readiness_threshold_requires_at_least_75_percent_and_no_deal_breakers(self):
        benchmark = {category: 3.8 for category in RADIX_CATEGORIES}
        candidate = {"skills": [
            {"skill_name": f"Evidence {category}", "category_code": category, "confidence": "high"}
            for category in RADIX_CATEGORIES
        ]}
        report = main.run_talent_check(candidate, "Synthetic benchmark", {"Synthetic benchmark": benchmark})

        self.assertGreaterEqual(report["readiness_score"], 75.0)
        self.assertEqual(report["deal_breakers_count"], 0)
        self.assertTrue(report["is_ready"])

    def test_markdown_report_includes_confidence_scores_and_deal_breaker_column(self):
        report = {
            "candidate_name": "Synthetic Student",
            "target_company": "Synthetic Company",
            "resume_skill_evidence": [
                {"skill_name": "Python", "category_code": "COD", "confidence": "high"},
                {"skill_name": "Django", "category_code": "COD", "confidence": "high"},
                {"skill_name": "SQL", "category_code": "SQL", "confidence": "medium"},
            ],
            "per_skillset_gap_breakdown": [
                {"category": "COD", "candidate_level": 4.0, "required_level": 4.5},
                {"category": "SQL", "candidate_level": 2.8, "required_level": 4.5},
                {"category": "NETW", "candidate_level": 0, "required_level": 3.0},
            ],
            "readiness_score": 82.5,
            "readiness_threshold": 75.0,
        }
        markdown = main.generate_markdown_report(report)
        self.assertIn("User resume score", markdown)
        self.assertIn("Deal breakers", markdown)
        self.assertIn("4.0 / 5.0 (high confidence)", markdown)
        self.assertIn("2.8 / 5.0 (medium confidence)", markdown)
        self.assertIn("No evidence found", markdown)
        self.assertIn("**Deal breakers (gap ≥ 1.5):** 2", markdown)
        self.assertIn("**Readiness score:** 82.5% — minimum threshold not met", markdown)

    def test_every_directory_company_has_a_complete_company_or_radix_benchmark(self):
        self.assertEqual(len(company_benchmark_metadata["companies"]), 118)
        for record in company_benchmark_metadata["companies"]:
            self.assertEqual(set(record["benchmark"]), set(RADIX_CATEGORIES))
            self.assertIn(record["benchmark_source"], {"company_skill_levels", "radix_median_fallback"})
        self.assertEqual(len({record["name"].casefold() for record in company_benchmark_metadata["companies"]}), 118)

    def test_markdown_report_includes_the_benchmark_source(self):
        scored = main.score_talent_check(main.TalentCheckRequest(
            candidate_profile=self.profile,
            company_id=1002,
        ))
        response = main.generate_markdown_report(scored["report"])
        self.assertIn("RADIX-wide median", response)
        self.assertIn("Ather Energy Limited", response)

    def test_synthetic_docx_resume_parses_and_flows_into_the_12_skill_report(self):
        class SyntheticExtractor:
            def extract_skills(self, text):
                return {
                    "mode": "llm_live",
                    "skills": [
                        {"skill_name": "Python", "category_code": "COD", "evidence": "Python", "confidence": "high"},
                        {"skill_name": "SQL", "category_code": "SQL", "evidence": "SQL", "confidence": "medium"},
                    ],
                }

        document = Document()
        for paragraph in (
            "Synthetic Integration Candidate",
            "synthetic@example.invalid",
            "Education",
            "B.Tech Computer Science",
            "Technical Skills",
            "Python, SQL, Git",
            "Projects",
            "Built a synthetic demonstration application",
        ):
            document.add_paragraph(paragraph)

        with tempfile.TemporaryDirectory(prefix="radix-test-", dir=Path(__file__).resolve().parent) as temp_dir:
            path = Path(temp_dir) / "synthetic-resume.docx"
            document.save(path)
            profile = ResumePipeline(extractor=SyntheticExtractor()).process_resume(str(path))

        validated = CandidateProfile.model_validate(profile)
        result = main.score_talent_check(main.TalentCheckRequest(
            candidate_profile=validated.model_dump(mode="json"),
            company_id=4,
        ))
        self.assertEqual(validated.name, "Synthetic Integration Candidate")
        self.assertEqual(validated.extraction_mode, "llm_live")
        self.assertEqual(len(result["report"]["per_skillset_gap_breakdown"]), 12)

    def test_ai_unavailable_never_awards_a_skill_badge_or_fake_pass(self):
        from backend.app.role4_service import evaluate_sprint_submission

        with patch("skill_proof_sprint.call_gemini_api", return_value="[API Error]: provider timed out"):
            result = evaluate_sprint_submission({"category": "COD", "task": "Design a solution"}, "Synthetic answer")
        self.assertFalse(result["is_passed"])
        self.assertEqual(result["score_pct"], 0)
        self.assertEqual(result["verified_skill_badge"], "")
        self.assertEqual(result["evaluation_status"], "unavailable")

    def test_role4_provider_falls_back_after_gemini_failure(self):
        gemini_client = MagicMock()
        gemini_client.__enter__.return_value.models.generate_content.side_effect = httpx.TimeoutException("synthetic timeout")
        http_response = MagicMock()
        http_response.json.return_value = {"choices": [{"message": {"content": "Synthetic backup response"}}]}
        backup_client = MagicMock()
        backup_client.__enter__.return_value.post.return_value = http_response
        providers = [{
            "provider": "openrouter",
            "api_key": "test-only",
            "base_url": "https://openrouter.example/v1",
            "model": "test-model",
        }]
        with (
            patch.object(role4_config, "get_gemini_key", return_value="test-only"),
            patch.object(role4_config.genai, "Client", return_value=gemini_client),
            patch.object(role4_config, "get_ai_provider_configs", return_value=providers),
            patch.object(role4_config.httpx, "Client", return_value=backup_client),
        ):
            result = role4_config.call_gemini_api("Synthetic prompt without student data")
        self.assertEqual(result, "Synthetic backup response")
        backup_client.__enter__.return_value.post.assert_called_once()

    def test_mock_interview_uses_local_rubric_when_ai_provider_is_unavailable(self):
        from backend.app.role4_service import evaluate_profile_interview_answer

        answer = (
            "I designed and implemented a Python API for the project. For example, I tested the data flow, "
            "compared two approaches, and chose the simpler design because it reduced response time. "
            "I measured the result and improved reliability for users."
        )
        with patch("interview_practice.call_gemini_api", return_value="[API Error]: provider timed out"):
            result = evaluate_profile_interview_answer("How did you use Python to design an API?", answer, "Python")

        self.assertEqual(result["evaluation_status"], "scored")
        self.assertEqual(result["evaluation_method"], "local_fallback")
        self.assertGreaterEqual(result["score_pct"], 0)
        self.assertLessEqual(result["score_pct"], 100)
        self.assertEqual(set(result["criteria"]), {"technical_accuracy", "relevance", "explanation"})
        self.assertTrue(all(0 <= score <= 2 for score in result["criteria"].values()))
        self.assertIn("local rubric", result["feedback"])

    def test_mock_interview_malformed_ai_response_falls_back_and_empty_answer_is_handled(self):
        from backend.app.role4_service import evaluate_profile_interview_answer

        with patch("interview_practice.call_gemini_api", return_value='{"technical_accuracy": "two"}'):
            result = evaluate_profile_interview_answer("Explain Python", "", "Python")

        self.assertEqual(result["evaluation_status"], "scored")
        self.assertEqual(result["evaluation_method"], "local_fallback")
        self.assertFalse(result["is_passed"])
        self.assertEqual(result["score_pct"], 0)
        self.assertIn("response is empty", result["feedback"])

    def test_mock_interview_provider_exception_falls_back_without_losing_answer(self):
        from backend.app.role4_service import evaluate_profile_interview_answer

        with patch("interview_practice.call_gemini_api", side_effect=TimeoutError("synthetic timeout")):
            result = evaluate_profile_interview_answer(
                "Explain a Python design choice", "I chose a simple design because it was easier to test.", "Python"
            )

        self.assertEqual(result["evaluation_status"], "scored")
        self.assertEqual(result["evaluation_method"], "local_fallback")
        self.assertGreater(result["score_pct"], 0)


if __name__ == "__main__":
    unittest.main()
