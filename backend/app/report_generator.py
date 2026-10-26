# report_generator.py
from datetime import datetime

categories = {
    "COD": "Coding", "DSA": "Data Structures & Algorithms", "OOD": "Object-Oriented Design",
    "APTI": "Aptitude", "COMM": "Communication", "AI": "AI / ML", "CLOUD": "Cloud",
    "SQL": "SQL & Databases", "SWE": "Software Engineering", "SYSD": "System Design",
    "NETW": "Networking", "OS": "Operating Systems", "EQ": "Emotional Intelligence",
    "CDG": "Continuous Delivery / DevOps"
}

def generate_markdown_report(report: dict) -> str:
    """
    Generate a clean, strictly 1-page Candidate Competency Report
    highlighting the Competency Matrix vs. Company Benchmark (12 RADIX Skillsets).
    """
    candidate_name = report.get("candidate_name", "Candidate")
    target_company = report.get("target_company") or report.get("company") or "Target Company"
    readiness_score = report.get("readiness_score", 0.0)
    is_ready = report.get("is_ready", False)
    threshold = report.get("readiness_threshold", 75.0)
    learning_hours = report.get("total_estimated_learning_hours", 0)
    deal_breakers_count = report.get("deal_breakers_count", 0)

    lines = []
    lines.append(f"# RADIX Talent Match - Candidate Competency Report (1-Page Official)")
    lines.append("")
    lines.append(f"**Candidate:** {candidate_name} | **Target Company:** {target_company} | **Date:** {datetime.now().strftime('%d %B %Y')}")
    lines.append(f"**Readiness Score:** {readiness_score}% (Bar: {threshold}%) | **Hiring Status:** {'READY FOR HIRING' if is_ready else 'NEEDS PREPARATION'}")
    lines.append(f"**Estimated Prep Time:** {learning_hours} hrs | **Critical Deal-Breakers:** {deal_breakers_count}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(f"### Competency Matrix vs. {target_company} (12 RADIX Skillsets)")
    lines.append("")
    lines.append("| # | Competency | Candidate Level | Company Bar | Gap | Study Hours | Status |")
    lines.append("|---|------------|-----------------|-------------|-----|-------------|--------|")

    breakdown = report.get("per_skillset_gap_breakdown") or report.get("skillset_gap") or []
    for idx, item in enumerate(breakdown, 1):
        if isinstance(item, dict):
            cat_code = item.get("category") or item.get("category_code") or item.get("skill") or ""
            cat_label = categories.get(cat_code, cat_code or f"Skill {idx}")
            cand_lvl = float(item.get("candidate_level", 0.0))
            req_lvl = float(item.get("required_level", 0.0))
            
            raw_gap = item.get("gap", 0.0)
            if isinstance(raw_gap, bool):
                gap_val = max(0.0, req_lvl - cand_lvl) if raw_gap else 0.0
            else:
                gap_val = float(raw_gap)

            raw_hours = item.get("estimated_learning_hours")
            if raw_hours is not None:
                hours_val = float(raw_hours)
            else:
                hours_val = round(gap_val * 10.0, 1)

            if item.get("is_deal_breaker") or gap_val >= 1.5:
                status_str = "DEAL-BREAKER"
            elif gap_val > 0:
                status_str = f"Needs Prep (+{gap_val:.1f})"
            else:
                status_str = "Met Bar [Passed]"

            gap_display = f"+{gap_val:.1f}" if gap_val > 0 else "0.0"
            lines.append(f"| {idx} | {cat_label} | {cand_lvl:.1f} / 5.0 | {req_lvl:.1f} / 5.0 | {gap_display} | {hours_val:.1f} hrs | {status_str} |")

    lines.append("")
    lines.append("---")
    lines.append("")

    what_if = report.get("what_if_recommendation", {})
    if isinstance(what_if, dict) and what_if.get("recommended_skill_to_study"):
        skill = what_if.get("recommended_skill_to_study")
        skill_name = categories.get(skill, skill)
        boost = what_if.get("projected_score_boost_pct", 0)
        lines.append(f"**Highest ROI Quick Win:** Level up **{skill_name}** by +1.0 level to immediately gain **+{boost}%** readiness score boost!")

    advice = report.get("ai_candidate_agent_advice")
    if advice:
        lines.append(f"**Career Coach Takeaway:** {advice}")

    lines.append("")
    lines.append("*(Report designed strictly as a 1-page official assessment by RADIX Talent Check Engine)*")
    return "\n".join(lines)

def save_report_to_file(report: dict, filename: str = None) -> str:
    if filename is None:
        safe_name = str(report.get("candidate_name", "candidate")).replace(" ", "_")
        company = report.get("target_company") or report.get("company") or "company"
        filename = f"RADIX_Report_{safe_name}_{company}.md"

    content = generate_markdown_report(report)
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    return filename
