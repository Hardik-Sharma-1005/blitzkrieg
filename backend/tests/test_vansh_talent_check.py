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


if __name__ == "__main__":
    unittest.main()
