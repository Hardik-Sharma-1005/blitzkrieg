
import json
import difflib
import argparse
from pathlib import Path

FUZZY_THRESHOLD = 0.80

SKILL_ALIASES = {
    "js": "javascript",
    "javascript": "javascript",
    "py": "python",
    "python": "python",
    "react.js": "react",
    "reactjs": "react",
    "node.js": "nodejs",
    "node": "nodejs",
    "postgres": "postgresql",
}


def normalize_skill(skill):
    skill = " ".join(skill.strip().lower().split())
    return SKILL_ALIASES.get(skill, skill)


def match_skills(required_skills, candidate_skills):
    matched_skills = []
    missing_skills = []

    normalized_candidates = []

    for item in candidate_skills:
        normalized_candidates.append(
            normalize_skill(item["skill_name"])
        )

    unique_required = []
    seen = set()

    for item in required_skills:
        skill_name = normalize_skill(item["skill_name"])

        if skill_name not in seen:
            seen.add(skill_name)
            unique_required.append(item)

    for item in unique_required:
        skill_name = item["skill_name"].strip()
        normalized_skill = normalize_skill(skill_name)

        if normalized_skill in normalized_candidates:
            matched_skills.append(skill_name)
            continue

        found = False

        for candidate in normalized_candidates:
            if len(normalized_skill) < 4 or len(candidate) < 4:
                continue

            similarity = difflib.SequenceMatcher(
                None, normalized_skill, candidate
            ).ratio()

            if similarity >= FUZZY_THRESHOLD:
                found = True
                break

        if found:
            matched_skills.append(skill_name)
        else:
            missing_skills.append(skill_name)

    if len(unique_required) == 0:
        score = 0
    else:
        score = (
            len(matched_skills) / len(unique_required)
        ) * 100

    return matched_skills, missing_skills, round(score, 2)


def run_matching(resume_path, jd_path):
    with open(resume_path, "r", encoding="utf-8") as file:
        resume_data = json.load(file)

    with open(jd_path, "r", encoding="utf-8") as file:
        jd_data = json.load(file)

    if not isinstance(resume_data, dict):
        raise ValueError("Resume JSON must contain an object")

    if not isinstance(jd_data, dict):
        raise ValueError("JD JSON must contain an object")

    if resume_data.get("source_type") != "resume":
        raise ValueError("Resume source_type must be 'resume'")

    if "skills" not in resume_data:
        raise ValueError("Resume JSON is missing the 'skills' field")

    if not isinstance(resume_data["skills"], list):
        raise ValueError("Resume 'skills' must be a list")

    if jd_data.get("source_type") != "jd":
        raise ValueError("Job source_type must be 'jd'")

    for field in ["source_file", "company", "role", "skills"]:
        if field not in jd_data:
            raise ValueError(
                f"Job JSON is missing the '{field}' field"
            )

    if (
        not isinstance(jd_data["source_file"], str)
        or not jd_data["source_file"].strip()
    ):
        raise ValueError(
            "Job source_file must be a non-empty string"
        )

    if not isinstance(jd_data["skills"], list):
        raise ValueError("Job 'skills' must be a list")

    for skill in resume_data["skills"]:
        if (
            not isinstance(skill, dict)
            or not isinstance(skill.get("skill_name"), str)
            or not skill["skill_name"].strip()
        ):
            raise ValueError(
                "Each resume skill must have a non-empty "
                "string 'skill_name'"
            )

    for skill in jd_data["skills"]:
        if (
            not isinstance(skill, dict)
            or not isinstance(skill.get("skill_name"), str)
            or not skill["skill_name"].strip()
        ):
            raise ValueError(
                "Each JD skill must have a non-empty "
                "string 'skill_name'"
            )

    matched, missing, score = match_skills(
        jd_data["skills"],
        resume_data["skills"]
    )

    return {
        "jd_source_file": jd_data["source_file"],
        "match_score": score,
        "matched_skills": matched,
        "missing_skills": missing
    }


def main():
    folder = Path(__file__).parent

    parser = argparse.ArgumentParser(
        description="Match resume skills against job requirements."
    )

    parser.add_argument(
        "resume",
        nargs="?",
        help="Path to the resume JSON file"
    )

    parser.add_argument(
        "jd",
        nargs="?",
        help="Path to the job description JSON file"
    )

    parser.add_argument(
        "-o",
        "--output",
        help="Optional path to save the result JSON"
    )

    args = parser.parse_args()

    # Use demo files when no input paths are supplied.
    resume_path = (
        Path(args.resume) if args.resume
        else folder / "resume.json"
    )

    jd_path = (
        Path(args.jd) if args.jd
        else folder / "job.json"
    )

    # Preserve the default demo behavior.
    # Custom input files will not overwrite match_result.json
    # unless an output path is explicitly supplied.
    if args.output:
        output_path = Path(args.output)
    elif not args.resume and not args.jd:
        output_path = folder / "match_result.json"
    else:
        output_path = None

    try:
        result = run_matching(resume_path, jd_path)

        print(json.dumps(result, indent=4))

        if output_path is not None:
            output_path.parent.mkdir(
                parents=True, exist_ok=True
            )

            with open(
                output_path, "w", encoding="utf-8"
            ) as file:
                json.dump(result, file, indent=4)

            print(f"\nResult saved to: {output_path}")

    except FileNotFoundError as error:
        print(f"Error: Required file not found: {error.filename}")

    except json.JSONDecodeError as error:
        print(f"Error: Invalid JSON format: {error}")

    except ValueError as error:
        print(f"Error: {error}")


if __name__ == "__main__":
    main()
