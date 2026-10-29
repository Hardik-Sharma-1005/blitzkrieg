import os
import unittest
from unittest.mock import patch

from google.genai import errors
import httpx

from ai_agent import ask_ai_agent_single_question
from config import call_gemini_api


class GeminiApiTests(unittest.TestCase):
    def setUp(self):
        self.load_dotenv = patch("config.load_dotenv")
        self.load_dotenv.start()
        self.addCleanup(self.load_dotenv.stop)
        self.environment = patch.dict(os.environ, {}, clear=True)
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def test_requires_api_key_without_constructing_client(self):
        with patch("config.genai.Client") as client_factory:
            response = call_gemini_api("Hello")

        self.assertIn("No Gemini API key found", response)
        client_factory.assert_not_called()

    def test_uses_supported_default_model_and_trims_response(self):
        os.environ["GEMINI_API_KEY"] = "test-key"
        with patch("config.genai.Client") as client_factory:
            client = client_factory.return_value.__enter__.return_value
            client.models.generate_content.return_value.text = "  Hello!  "

            response = call_gemini_api("Say hello")

        self.assertEqual(response, "Hello!")
        client.models.generate_content.assert_called_once_with(
            model="gemini-3.8-flash",
            contents="Say hello",
        )
        client_factory.assert_called_once_with(api_key="test-key")

    def test_allows_model_override_from_environment(self):
        os.environ["GEMINI_API_KEY"] = "test-key"
        os.environ["GEMINI_MODEL"] = "gemini-test-model"
        with patch("config.genai.Client") as client_factory:
            client = client_factory.return_value.__enter__.return_value
            client.models.generate_content.return_value.text = "Answer"

            response = call_gemini_api("Question")

        self.assertEqual(response, "Answer")
        client.models.generate_content.assert_called_once_with(
            model="gemini-test-model",
            contents="Question",
        )

    def test_reports_api_errors_without_falling_back_to_retired_models(self):
        os.environ["GEMINI_API_KEY"] = "test-key"
        with patch("config.genai.Client") as client_factory:
            client = client_factory.return_value.__enter__.return_value
            client.models.generate_content.side_effect = errors.APIError(
                404, {"error": {"message": "model not found"}}
            )

            response = call_gemini_api("Question")

        self.assertIn("Gemini request failed (404)", response)
        self.assertIn("model not found", response)
        client.models.generate_content.assert_called_once()

    def test_reports_connection_errors(self):
        os.environ["GEMINI_API_KEY"] = "test-key"
        with patch("config.genai.Client") as client_factory:
            client = client_factory.return_value.__enter__.return_value
            client.models.generate_content.side_effect = httpx.ConnectError(
                "network unavailable"
            )

            response = call_gemini_api("Question")

        self.assertIn("Unable to connect to Gemini", response)
        self.assertIn("network unavailable", response)

    def test_coach_includes_question_and_returns_gemini_response(self):
        report = {
            "candidate_name": "Example Candidate",
            "target_company": "Example Company",
            "readiness_score": 68.0,
            "deal_breakers_list": [],
            "total_estimated_learning_hours": 40,
            "what_if_recommendation": {},
            "per_skillset_gap_breakdown": [],
        }
        with patch("ai_agent.call_gemini_api", return_value="Study OS first.") as call:
            response = ask_ai_agent_single_question(report, "What are my weaknesses?")

        self.assertEqual(response, "Study OS first.")
        self.assertIn("Example Candidate", call.call_args.args[0])
        self.assertIn("What are my weaknesses?", call.call_args.args[0])


if __name__ == "__main__":
    unittest.main()
