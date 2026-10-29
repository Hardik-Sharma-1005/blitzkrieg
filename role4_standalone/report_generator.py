"""Create a cautious, evidence-focused company benchmark summary."""

from datetime import datetime

CONFIDENCE_SCORES = {"high": 3.8, "medium": 2.8, "low": 1.8}
CATEGORY_ALIASES = {"CDG": "COD"}
DEAL_BREAKER_THRESHOLD = 1.5
CATEGORY_WEIGHTS = {
    "COD": 1.4, "CDG": 1.4, "DSA": 1.4, "SYSD": 1.3, "SWE": 1.2,
    "OOD": 1.1, "CLOUD": 1.1, "AI": 1.0, "APTI": 1.0, "SQL": 1.0,
    "OS": 0.9, "NETW": 0.9, "COMM": 0.8, "EQ": 0.8,
}


def _category_code(value):
    category = str(value or "OTHER").upper().strip()
    return CATEGORY_ALIASES.get(category, category)


def _user_resume_score(category, resume_skills):
    matching = [
        skill for skill in resume_skills
        if isinstance(skill, dict)
        and _category_code(skill.get("category_code") or skill.get("category")) == _category_code(category)
    ]
    if not matching:
        return None, None, 0
    confidences = [str(skill.get("confidence", "medium")).lower() for skill in matching]
    confidence = max(confidences, key=lambda item: CONFIDENCE_SCORES.get(item, 2.5))
    base = CONFIDENCE_SCORES.get(confidence, 2.5)
    score = min(5.0, base + (len(matching) - 1) * 0.2)
    return round(score, 1), confidence, len(matching)


def _deal_breaker_status(required, score, weight=1.0):
    try:
        target = float(required)
    except (TypeError, ValueError):
        target = 0.0
    gap = round(target - (score if score is not None else 0.0), 1)
    try:
        important_skill = float(weight or 0) >= 1.2
    except (TypeError, ValueError):
        important_skill = False
    is_deal_breaker = gap >= DEAL_BREAKER_THRESHOLD and important_skill
    if gap > 0:
        detail = f"gap {gap:.1f}"
    elif gap < 0:
        detail = f"{abs(gap):.1f} above target"
    else:
        detail = "at target"
    label = "Deal breaker" if is_deal_breaker else "No deal breaker"
    return is_deal_breaker, f"{label} ({detail})"


def generate_markdown_report(report: dict) -> str:
    if report.get("error"):
        return f"# Error\n\n{report.get('message', 'Unknown error')}"

    resume_skills = report.get("resume_skill_evidence", [])
    if not isinstance(resume_skills, list):
        resume_skills = []
    assessments = []
    breakdown = report.get("per_skillset_gap_breakdown", [])
    if not isinstance(breakdown, list):
        breakdown = []
    for item in breakdown:
        if not isinstance(item, dict):
            continue
        category = item.get("category", "Other")
        score, confidence, _ = _user_resume_score(category, resume_skills)
        category_code = _category_code(item.get("category_code") or category)
        weight = item.get("weight", CATEGORY_WEIGHTS.get(category_code, 1.0))
        flagged, status = _deal_breaker_status(item.get("required_level", 0), score, weight)
        assessments.append((item, category, score, confidence, status, flagged))
    deal_breakers_count = sum(1 for _, _, _, _, _, flagged in assessments if flagged)
    try:
        readiness_score = max(0.0, min(100.0, float(report.get("readiness_score", 0))))
    except (TypeError, ValueError):
        readiness_score = 0.0
    try:
        readiness_threshold = float(report.get("readiness_threshold", 75.0))
    except (TypeError, ValueError):
        readiness_threshold = 75.0
    meets_readiness_threshold = readiness_score >= readiness_threshold and deal_breakers_count == 0
    readiness_verdict = report.get("readiness_verdict") or (
        "UNREADY" if readiness_score < 50
        else "READY" if meets_readiness_threshold
        else "NEEDS PREPARATION"
    )

    lines = [
        "# User Resume Score and Company Benchmark Overview",
        f"**Candidate:** {report.get('candidate_name', 'Candidate')}",
        f"**Target company:** {report.get('target_company', 'Selected company')}",
    ]
    if report.get("benchmark_notice"):
        lines.append(f"**Benchmark source:** {report['benchmark_notice']}")
    lines.extend([
        f"**Generated on:** {datetime.now().strftime('%d %B %Y, %I:%M %p')}",
        f"**Deal breakers (gap ≥ {DEAL_BREAKER_THRESHOLD:.1f}):** {deal_breakers_count}",
        f"**Readiness score:** {readiness_score:.1f}%",
        f"**Readiness verdict:** {readiness_verdict} — {'minimum threshold met' if meets_readiness_threshold else 'minimum threshold not met'} (requires at least {readiness_threshold:.0f}% and 0 deal breakers)",
        "",
        "> This is an informational comparison. Resume mentions do not establish skill proficiency, determine job readiness, or predict a hiring outcome. Company benchmarks do not identify mandatory job requirements.",
        "",
        "## User Resume Score vs. Company Benchmark",
        "",
        "| Skill area | User resume score | Company target | Deal breakers |",
        "|---|---:|---:|---|",
    ])

    for item, category, score, confidence, status, _ in assessments:
        score_text = f"{score:.1f} / 5.0 ({confidence} confidence)" if score is not None else "No evidence found"
        try:
            target = float(item.get("required_level") or 0)
        except (TypeError, ValueError):
            target = 0.0
        lines.append(f"| {category} | {score_text} | {target:.1f} / 5.0 | {status} |")

    lines.extend([
        "",
        "**Score formula:** high confidence = 3.8, medium = 2.8, low = 1.8; each additional resume skill in the same category adds 0.2, capped at 5.0. Missing evidence has no user score and is treated as 0 only when calculating the gap. A gap of 1.5 or more is flagged as a deal breaker for preparation review; it is not a hiring decision.",
        "",
        "Generated by blitzkrieg Talent Check",
    ])
    return "\n".join(lines)


def save_report_to_file(report: dict, filename: str = None) -> str:
    if filename is None:
        safe_name = str(report.get("candidate_name", "candidate")).replace(" ", "_")
        company = str(report.get("target_company", "company")).replace(" ", "_")
        filename = f"RADIX_Report_{safe_name}_{company}.md"
    with open(filename, "w", encoding="utf-8") as file:
        file.write(generate_markdown_report(report))
    return filename
