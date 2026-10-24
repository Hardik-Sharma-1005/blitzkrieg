"""
RADIX Talent Match Hackathon - Role 2 Test Runner (temprunner.py)
Executes end-to-end verification of Candidate Resume Parsing across PDF and DOCX,
generates output JSON files in output/resumes/, and tests guardrail rejection on JDs.
"""

import json
import os
import sys

# Configure stdout for UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from backend.app.resume_pipeline import ResumePipeline
except ImportError:
    from backend.resume_pipeline import ResumePipeline


def run():
    print("=" * 80)
    print("RADIX TALENT MATCH - ROLE 2 (RESUME PARSING) VERIFICATION")
    print("=" * 80)

    data_dir = os.path.join(BASE_DIR, "data", "resumes")
    output_dir = os.path.join(BASE_DIR, "output", "resumes")
    os.makedirs(output_dir, exist_ok=True)

    pdf_dir = os.path.join(data_dir, "PDF")
    docx_dir = os.path.join(data_dir, "Word")

    pipeline = ResumePipeline()
    passed = 0
    total = 0

    # ---------------------------------------------------------------------------
    # 1. Process PDF Resumes
    # ---------------------------------------------------------------------------
    print("\n[PHASE 1] Processing Sample PDF Resumes...")
    if os.path.exists(pdf_dir):
        for f in sorted(os.listdir(pdf_dir)):
            if f.endswith(".pdf"):
                total += 1
                in_path = os.path.join(pdf_dir, f)
                candidate_slug = os.path.splitext(f)[0].replace(" ", "_").lower()
                out_path = os.path.join(output_dir, f"{candidate_slug}_pdf.json")

                try:
                    profile = pipeline.process_resume(in_path, output_json_path=out_path)
                    name = profile["name"]
                    skills_cnt = len(profile["skills"])
                    hacks_cnt = len(profile["hackathons"])
                    intern_cnt = len(profile["internships"])
                    certs_cnt = len(profile["certifications"])
                    mode = profile["extraction_mode"]
                    print(
                        f"  [PASS] {f:<25} | Name: {name:<20} | Skills: {skills_cnt:<2} "
                        f"| Hacks: {hacks_cnt} | Interns: {intern_cnt} | Certs: {certs_cnt} | Mode: {mode}"
                    )
                    passed += 1
                except Exception as e:
                    print(f"  [FAIL] {f}: {e}")

    # ---------------------------------------------------------------------------
    # 2. Process Word Resumes (.docx)
    # ---------------------------------------------------------------------------
    print("\n[PHASE 2] Processing Sample Word Resumes (.docx)...")
    if os.path.exists(docx_dir):
        for f in sorted(os.listdir(docx_dir)):
            if f.endswith(".docx"):
                total += 1
                in_path = os.path.join(docx_dir, f)
                candidate_slug = os.path.splitext(f)[0].replace(" ", "_").lower()
                out_path = os.path.join(output_dir, f"{candidate_slug}_docx.json")

                try:
                    profile = pipeline.process_resume(in_path, output_json_path=out_path)
                    name = profile["name"]
                    skills_cnt = len(profile["skills"])
                    hacks_cnt = len(profile["hackathons"])
                    intern_cnt = len(profile["internships"])
                    certs_cnt = len(profile["certifications"])
                    print(
                        f"  [PASS] {f:<25} | Name: {name:<20} | Skills: {skills_cnt:<2} "
                        f"| Hacks: {hacks_cnt} | Interns: {intern_cnt} | Certs: {certs_cnt}"
                    )
                    passed += 1
                except Exception as e:
                    print(f"  [FAIL] {f}: {e}")

    # ---------------------------------------------------------------------------
    # 3. Guardrail Check (Upload Mismatch Protection)
    # ---------------------------------------------------------------------------
    print("\n[PHASE 3] Upload Guardrail Check (Reject Accidental JD Uploads)...")
    sample_jd_path = None
    for candidate_jd in [
        os.path.join(BASE_DIR, "data", "jds", "PDF", "Google LLC - Software Engineer.pdf"),
        os.path.join(BASE_DIR, "sample_data", "JDs", "PDF", "Google LLC - Software Engineer.pdf"),
        r"C:\Users\daksh\Desktop\Bootcamp Hackathon\sample_data\JDs\PDF\Google LLC - Software Engineer.pdf",
    ]:
        if os.path.exists(candidate_jd):
            sample_jd_path = candidate_jd
            break

    if sample_jd_path:
        total += 1
        try:
            pipeline.process_resume(sample_jd_path)
            print(f"  [FAIL] Guardrail did not reject JD: {os.path.basename(sample_jd_path)}")
        except ValueError as e:
            print(f"  [PASS] Guardrail correctly caught JD upload:\n         \"{e}\"")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] Unexpected error: {e}")

    print("\n" + "=" * 80)
    print(f"VERIFICATION SUMMARY: {passed}/{total} Passed ({passed/total*100:.1f}%)")
    print(f"Candidate JSON profiles saved to: {output_dir}")
    print("=" * 80)


if __name__ == "__main__":
    run()
