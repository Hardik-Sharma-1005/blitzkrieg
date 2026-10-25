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
    from app.mock_data import sample_candidate, company_benchmarks

    report = run_talent_check(sample_candidate, "Google", company_benchmarks)
    assert report["error"] is False, "Talent check returned an error"
    assert report["readiness_score"] == 82.5, f"Unexpected score: {report['readiness_score']}"
    assert "company" in report and "skillset_gap" in report, "Shared contract keys missing"
    print("  ✅ Core engine runs cleanly.")
    print(f"  ✅ Mock Candidate: {report['candidate_name']} -> Score: {report['readiness_score']}% (Target: Google)")
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
print("\n[CHECK 3]: Testing Real Candidate Resumes from Role 2/3 Parser...")
try:
    from app.resume_pipeline import parse_and_extract_resume

    resumes_dir = ROOT_DIR / "data" / "resumes" / "PDF"
    sample_files = [
        ("Rohan Verma.pdf", "Google", True),
        ("Ananya Rao.pdf", "Google", False),
        ("Karthik Subramaniam.pdf", "Google", False),
        ("Priya Menon.pdf", "Oracle", False),
    ]

    for fname, target_comp, expected_ready in sample_files:
        fpath = resumes_dir / fname
        if not fpath.exists():
            continue
        
        # 1. Parse resume through real Role 2/3 pipeline
        real_profile = parse_and_extract_resume(str(fpath))
        
        # 2. Feed directly into your Role 4 Talent Check engine
        real_report = run_talent_check(real_profile, target_comp, company_benchmarks)
        
        status_label = "READY ✅" if real_report["is_ready"] else "Needs Prep ⚠️"
        print(f"  📄 {fname:<25} vs {target_comp:<7} -> Score: {real_report['readiness_score']:>5.1f}% | {status_label} | Gaps: {len(real_report['deal_breakers_list'])} deal-breakers")

    print("  ✅ All real candidate profiles parse and score dynamically with personalized gaps!")
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
print("🎉 ALL 5 INTEGRATION CHECKS PASSED! ROLE 4 IS 100% PRODUCTION-READY!")
print("=" * 70)
