"""Evidence-aware matching of parsed resume skills to parsed job requirements."""

from __future__ import annotations

import difflib
import re
from typing import Any


FUZZY_SUGGESTION_THRESHOLD = 0.84

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
    "postgresql": "postgresql",
    "amazon web services": "aws",
    "google cloud platform": "gcp",
    "ms sql": "sql server",
    "mssql": "sql server",
}


def normalize_skill(skill: str) -> str:
    """Normalize common spelling and punctuation variants for exact matching."""
    normalized = " ".join(skill.casefold().strip().split())
    normalized = re.sub(r"\s*([.+#])\s*", r"\1", normalized)
    normalized = re.sub(r"[^\w.+#]+", " ", normalized, flags=re.UNICODE)
    normalized = " ".join(normalized.split())
    return SKILL_ALIASES.get(normalized, normalized)


def _best_candidate(required_skill: str, candidates: list[dict[str, Any]]) -> dict[str, Any] | None:
    target = normalize_skill(required_skill)
    for candidate in candidates:
        if normalize_skill(candidate["skill_name"]) == target:
            return candidate
    return None


def match_profiles(candidate_profile: dict[str, Any], job_description: dict[str, Any]) -> dict[str, Any]:
    """Match JD requirements against resume evidence; fuzzy matches remain suggestions."""
    resume_skills = candidate_profile.get("skills", [])
    requirements = job_description.get("skills", [])
    if not requirements:
        raise ValueError("No job skills were extracted, so there is nothing to compare.")

    # Keep the first occurrence of each distinct requirement, as in Yash's matcher.
    unique_requirements: list[dict[str, Any]] = []
    seen: set[str] = set()
    for requirement in requirements:
        normalized = normalize_skill(requirement["skill_name"])
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique_requirements.append(requirement)
    if not unique_requirements:
        raise ValueError("No usable job skills were extracted, so there is nothing to compare.")

    matched: list[dict[str, Any]] = []
    possible: list[dict[str, Any]] = []
    missing: list[dict[str, Any]] = []

    for requirement in unique_requirements:
        name = requirement["skill_name"].strip()
        candidate = _best_candidate(name, resume_skills)
        row = {
            "skill_name": name,
            "category_code": requirement["category_code"],
            "job_evidence": requirement["evidence"],
            "job_confidence": requirement["confidence"],
        }
        if candidate:
            matched.append({
                **row,
                "resume_skill_name": candidate["skill_name"],
                "resume_evidence": candidate["evidence"],
                "resume_confidence": candidate["confidence"],
            })
            continue

        target = normalize_skill(name)
        suggestion: tuple[float, dict[str, Any]] | None = None
        for item in resume_skills:
            candidate_name = item["skill_name"].strip()
            normalized_candidate = normalize_skill(candidate_name)
            if min(len(target), len(normalized_candidate)) < 4:
                continue
            similarity = difflib.SequenceMatcher(None, target, normalized_candidate).ratio()
            if similarity >= FUZZY_SUGGESTION_THRESHOLD and (suggestion is None or similarity > suggestion[0]):
                suggestion = (similarity, item)

        if suggestion:
            item = suggestion[1]
            possible.append({
                **row,
                "resume_skill_name": item["skill_name"],
                "resume_evidence": item["evidence"],
                "resume_confidence": item["confidence"],
                "similarity": round(suggestion[0], 2),
            })
        else:
            missing.append(row)

    total = len(unique_requirements)
    return {
        "source_type": "skill_match",
        "candidate_name": candidate_profile.get("name", "Student"),
        "resume_source_file": candidate_profile.get("source_file", "Resume"),
        "company": job_description.get("company", ""),
        "role": job_description.get("role", ""),
        "job_source_file": job_description.get("source_file", "Job description"),
        "job_extraction_mode": job_description.get("extraction_mode", "unknown"),
        "job_extraction_note": job_description.get("extraction_note", ""),
        "match_score": round(len(matched) / total * 100, 2),
        "matched_count": len(matched),
        "possible_count": len(possible),
        "missing_count": len(missing),
        "total_requirements": total,
        "matched_skills": matched,
        "possible_matches": possible,
        "missing_skills": missing,
        "score_note": "Confirmed coverage counts exact names and recognized aliases only. Possible text matches are shown separately and are not counted.",
    }
