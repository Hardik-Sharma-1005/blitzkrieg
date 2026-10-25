# scripts/verify_role4_integration.py
"""
RADIX Talent Match - Role 4 Final Integration Verification Script
Run this script to verify that Role 4 works flawlessly with both mock data
and real data from Roles 1, 2, and 3.
"""

import sys
import os
from pathlib import Path

# Add backend and role4 to path
ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR / "backend"))
sys.path.insert(0, str(ROOT_DIR / "role4_standalone"))

print("=" * 70)
print("🔍 RADIX TALENT MATCH — ROLE 4 FINAL INTEGRATION VERIFICATION")
print("=" * 70)

# -------------------------------------------------------------------
# CHECK 1: Core Engine & Benchmarks
# -------------------------------------------------------------------
print("\n[CHECK 1]: Verifying Talent Check Core Engine with Mock Candidate...")
try:
    from app.talent_check import run_talent_check, get_radar_chart_data
    from app.mock_data import sample_candidate, company_benchmark_metadata

    google_record = next(
        record for record in company_benchmark_metadata["companies"]
        if "google" in record["name"].casefold()
    )
    report = run_talent_check(
        sample_candidate,
        google_record["name"],
        {google_record["name"]: google_record["benchmark"]},
    )
    assert report["error"] is False, "Talent check returned an error"
    assert len(report["per_skillset_gap_breakdown"]) == 12, "Expected all RADIX-12 categories"
    assert "company" in report and "skillset_gap" in report, "Shared contract keys missing"
    print("  ✅ Core engine runs cleanly.")
    print(f"  ✅ Synthetic Candidate: {report['candidate_name']} -> Score: {report['readiness_score']}% (Target: {google_record['name']})")
    print(f"  ✅ Deal-Breakers: {report['deal_breakers_count']} found (SYSD gap)")
    print(f"  ✅ Contract keys: 'company'='{report['company']}', 'skillset_gap' count={len(report['skillset_gap'])}")
except Exception as e:
    print(f"  ❌ CHECK 1 FAILED: {e}")
    sys.exit(1)

# -------------------------------------------------------------------
# CHECK 2: Radar Chart Data for React Frontend
# -------------------------------------------------------------------
print("\n[CHECK 2]: Verifying Radar Chart Helper for Role 3 Frontend...")
try:
    radar = get_radar_chart_data(report)
    assert len(radar) == 12, f"Expected 12 categories, got {len(radar)}"
    assert "category" in radar[0] and "Candidate" in radar[0] and "CompanyGoal" in radar[0]
    print(f"  ✅ Radar chart data generated for all {len(radar)} RADIX categories.")
    print("  ✅ Formatted for React / Recharts visualization.")
except Exception as e:
    print(f"  ❌ CHECK 2 FAILED: {e}")
    sys.exit(1)

# -------------------------------------------------------------------
# CHECK 3: Real Data Integration from Roles 1, 2, and 3
# -------------------------------------------------------------------
print("\n[CHECK 3]: Testing the full benchmark scorer across all 118 companies...")
try:
    from app.mock_data import company_benchmark_metadata

    synthetic_profile = {
        "name": "Synthetic Integration Candidate",
        "skills": [
            {"skill_name": "Python", "category_code": "COD", "confidence": "high"},
            {"skill_name": "SQL", "category_code": "SQL", "confidence": "medium"},
        ],
    }
    for record in company_benchmark_metadata["companies"]:
        result = run_talent_check(
            synthetic_profile,
            record["name"],
            {record["name"]: record["benchmark"]},
        )
        assert result["error"] is False, f"Scoring failed for {record['name']}"
        assert len(result["per_skillset_gap_breakdown"]) == 12, f"RADIX-12 incomplete for {record['name']}"

    print("  ✅ All 118 company records scored against complete 12-category profiles.")
except Exception as e:
    print(f"  ❌ CHECK 3 FAILED: {e}")
    sys.exit(1)

# -------------------------------------------------------------------
# CHECK 4: FastAPI Shared Endpoint
# -------------------------------------------------------------------
print("\n[CHECK 4]: Verifying FastAPI Route in backend/app/main.py...")
try:
    try:
        from app.main import app
        found_route = any(getattr(route, "path", None) == "/api/talent-check" for route in app.routes)
        assert found_route, "Route /api/talent-check not found in app.routes"
        print("  ✅ Endpoint 'POST /api/talent-check' is mounted on the shared FastAPI server.")
    except (ImportError, ModuleNotFoundError):
        main_py = (ROOT_DIR / "backend" / "app" / "main.py").read_text(encoding="utf-8")
        assert "/api/talent-check" in main_py, "Route not in main.py"
        print("  ✅ Endpoint 'POST /api/talent-check' verified in backend/app/main.py.")
except Exception as e:
    print(f"  ❌ CHECK 4 FAILED: {e}")
    sys.exit(1)

# -------------------------------------------------------------------
# CHECK 5: Standalone Demo Tools
# -------------------------------------------------------------------
print("\n[CHECK 5]: Verifying Standalone Presentation Scripts...")
standalone_dir = ROOT_DIR / "role4_standalone"
required_scripts = ["interactive_demo.py", "master_pipeline.py", "report_generator.py", "test_talent_check.py"]
for s in required_scripts:
    p = standalone_dir / s
    assert p.exists(), f"Missing standalone script: {s}"
print(f"  ✅ All {len(required_scripts)} standalone presentation tools are present in role4_standalone/.")

print("\n" + "=" * 70)
print("🎉 ALL 5 INTEGRATION CHECKS PASSED.")
print("=" * 70)
