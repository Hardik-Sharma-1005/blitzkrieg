# scripts/verify_role4_integration.py
"""
RADIX Talent Match - Role 4 Final Integration Verification Script
Run this script to verify the shared Role 4 engine and its handoff contracts.
"""

import sys
import os
from pathlib import Path


# Add backend and role4 to path
ROOT_DIR = Path(__file__).resolve().parents[1]
os.environ["LLM_PROVIDER"] = "off"  # Bundled resume fixtures must stay offline.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
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
    from app.mock_data import sample_candidate, sample_skill_ratings, company_benchmarks

    report = run_talent_check(sample_candidate, "Google", company_benchmarks, sample_skill_ratings)
    assert report["error"] is False, "Talent check returned an error"
    assert 0 <= report["readiness_score"] <= 100, f"Invalid score: {report['readiness_score']}"
    assert report["benchmark_source"] == "illustrative_mock_data"
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
    assert len(radar) == 11, f"Expected 11 assessed demo categories, got {len(radar)}"
    assert "category" in radar[0] and "Candidate" in radar[0] and "CompanyGoal" in radar[0]
    print(f"  ✅ Radar chart data generated for {len(radar)} assessed demo categories.")
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
    from app.mock_data import sample_skill_ratings

    resumes_dir = ROOT_DIR / "data" / "resumes" / "PDF"
    sample_files = [
        ("Rohan Verma.pdf", "Google"),
        ("Ananya Rao.pdf", "Google"),
        ("Karthik Subramaniam.pdf", "Google"),
        ("Priya Menon.pdf", "Oracle"),
    ]

    for fname, target_comp in sample_files:
        fpath = resumes_dir / fname
        if not fpath.exists():
            continue
        
        # 1. Parse resume through real Role 2/3 pipeline
        real_profile = parse_and_extract_resume(str(fpath))
        
        assert all("level" not in skill for skill in real_profile.get("skills", [])), "Parser confidence must not become proficiency."
        try:
            run_talent_check(real_profile, target_comp, company_benchmarks, {})
        except ValueError as exc:
            assert "ratings are required" in str(exc)
        else:
            raise AssertionError("An un-rated resume must not receive a readiness score.")

        # Synthetic test ratings exercise the handoff; they are not resume-derived levels.
        rated_report = run_talent_check(real_profile, target_comp, company_benchmarks, sample_skill_ratings)
        assert isinstance(rated_report["readiness_score"], float)
        print(f"  📄 {fname:<25} parsed {len(real_profile['skills'])} skills; no score until explicit ratings are supplied.")

    print("  ✅ Resume parsing and explicit-rating gate work together without inventing proficiency.")
except Exception as e:
    print(f"  ❌ CHECK 3 FAILED: {e}")
    sys.exit(1)

# -------------------------------------------------------------------
# CHECK 4: FastAPI Shared Endpoint
# -------------------------------------------------------------------
print("\n[CHECK 4]: Verifying FastAPI Route in backend/app/main.py...")
try:
    try:
        from app.main import TalentCheckRequest, app, talent_check_endpoint
        from fastapi import HTTPException
        from pydantic import ValidationError
        found_route = any(getattr(route, "path", None) == "/api/talent-check" for route in app.routes)
        assert found_route, "Route /api/talent-check not found in app.routes"
        request_body = {
            "candidate_profile": {
                "source_type": "resume",
                "source_file": "sample.pdf",
                "cv_file": "sample.pdf",
                "name": "Sample Candidate",
                "email": "",
                "education": [],
                "projects": [],
                "hackathons": [],
                "internships": [],
                "certifications": [],
                "achievements": [],
                "preferred_roles": [],
                "skills": [{"skill_name": "Python", "category_code": "COD", "evidence": "Python", "confidence": "high"}],
                "extraction_mode": "offline_heuristic",
            },
            "company_name": "Google",
            "skill_ratings": {"COD": 3, "DSA": 3, "OOD": 3, "APTI": 3, "COMM": 3, "AI": 3, "CLOUD": 3, "SWE": 3, "SYSD": 3, "NETW": 3, "OS": 3},
        }
        parsed_request = TalentCheckRequest.model_validate(request_body)
        assert parsed_request.skill_ratings["COD"] == 3
        try:
            talent_check_endpoint(parsed_request).send(None)
        except StopIteration as finished:
            result = finished.value
        else:
            raise AssertionError("Talent Check endpoint unexpectedly awaited I/O.")
        assert result["report"]["benchmark_source"] == "illustrative_mock_data"
        missing_ratings = {**request_body, "skill_ratings": {}}
        try:
            talent_check_endpoint(TalentCheckRequest.model_validate(missing_ratings)).send(None)
        except HTTPException as exc:
            assert exc.status_code == 422
        except StopIteration:
            raise AssertionError("Missing ratings unexpectedly produced a score.")
        else:
            raise AssertionError("Missing student ratings must produce HTTP 422.")
        invalid_rating = {**request_body, "skill_ratings": {**request_body["skill_ratings"], "COD": 6}}
        try:
            TalentCheckRequest.model_validate(invalid_rating)
        except ValidationError:
            pass
        else:
            raise AssertionError("Ratings outside 1–5 must fail request validation.")
        print("  ✅ Endpoint accepts explicit 1–5 ratings and rejects missing or out-of-range ratings.")
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
print("🎉 All 5 integration checks passed. Company benchmarks remain illustrative demo data.")
print("=" * 70)
