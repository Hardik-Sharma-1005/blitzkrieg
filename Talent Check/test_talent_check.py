import unittest

from mock_data import company_benchmarks, sample_candidate
from talent_check import get_radar_chart_data, run_talent_check


class TalentCheckTests(unittest.TestCase):
    def test_google_report_and_radar_chart_are_generated(self):
        report = run_talent_check(sample_candidate, "Google", company_benchmarks)
        radar_chart_data = get_radar_chart_data(report)

        self.assertEqual(report["candidate_name"], "Rohan Verma")
        self.assertEqual(report["target_company"], "Google")
        self.assertIn("readiness_score", report)
        self.assertTrue(radar_chart_data)


if __name__ == "__main__":
    unittest.main()
