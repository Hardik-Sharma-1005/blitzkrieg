# talent_check.py

try:
    from .mock_data import RADIX_CATEGORIES
except ImportError:
    from mock_data import RADIX_CATEGORIES

CATEGORY_WEIGHTS = {
    "COD": 1.4, "DSA": 1.4, "SYSD": 1.3, "SWE": 1.2,
    "OOD": 1.1, "CLOUD": 1.1, "AI": 1.0, "APTI": 1.0,
    "SQL": 1.0, "OS": 0.9, "NETW": 0.9, "COMM": 0.8
}

SKILL_COMPLEXITY_HOURS = {
    "SYSD": 15, "DSA": 15, "AI": 15,
    "COD": 10, "OOD": 10, "CLOUD": 10, "OS": 10, "NETW": 10,
    "SQL": 8, "SWE": 5, "APTI": 5, "COMM": 5
}

CATEGORY_ALIASES = {
    "CDG": "COD", "COD": "COD",
}

CONFIDENCE_SCORES = {
    "high": 3.8,
    "medium": 2.8,
    "low": 1.8
}

def normalize_candidate_skills(candidate_profile: dict) -> dict:
    """
    Seamless bridge: Supports both mock data (with numeric level)
    and real Role 3 data (with confidence and category_code).
    """
    if not isinstance(candidate_profile, dict):
        return {}
    profile = dict(candidate_profile)
    raw_skills = candidate_profile.get("skills", [])
    if not isinstance(raw_skills, list):
        return profile

    cat_counts = {}
    for s in raw_skills:
        if isinstance(s, dict):
            cat = str(s.get("category_code", "OTHER")).upper().strip()
            cat = CATEGORY_ALIASES.get(cat, cat)
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

    normalized_skills = []
    for s in raw_skills:
        if not isinstance(s, dict):
            continue
        cat = str(s.get("category_code", "OTHER")).upper().strip()
        cat = CATEGORY_ALIASES.get(cat, cat)

        if "level" in s and s["level"] is not None:
            try:
                lvl = float(s["level"])
            except (ValueError, TypeError):
                lvl = 0.0
        else:
            conf = str(s.get("confidence", "medium")).lower()
            base = CONFIDENCE_SCORES.get(conf, 2.5)
            lvl = min(5.0, base + (cat_counts.get(cat, 1) - 1) * 0.2)

        normalized_skills.append({
            "skill_name": s.get("skill_name", ""),
            "category_code": cat,
            "level": lvl
        })

    profile["skills"] = normalized_skills
    return profile

def run_talent_check(candidate_profile, company_name, company_benchmarks):
    if not isinstance(candidate_profile, dict):
        candidate_profile = {}

    candidate_profile = normalize_candidate_skills(candidate_profile)
    candidate_name = candidate_profile.get("name", "Candidate")

    matched_company_key = None
    if isinstance(company_name, str):
        clean_target = company_name.strip().lower()
        for b_name in company_benchmarks.keys():
            b_lower = b_name.lower()
            if b_lower == clean_target or b_lower in clean_target or clean_target in b_lower:
                matched_company_key = b_name
                break

    if not matched_company_key:
        available = list(company_benchmarks.keys())
        return {
            "error": True,
            "message": f"Company '{company_name}' not found. Available: {available}",
            "candidate_name": candidate_name,
            "readiness_score": 0.0,
            "is_ready": False
        }

    benchmark = company_benchmarks[matched_company_key]

    candidate_levels = {cat: 0.0 for cat in RADIX_CATEGORIES}
    skills_list = candidate_profile.get("skills", [])
    if isinstance(skills_list, list):
        for skill in skills_list:
            if isinstance(skill, dict):
                cat = str(skill.get("category_code", "")).upper().strip()
                try:
                    level = float(skill.get("level", 0.0))
                except (ValueError, TypeError):
                    level = 0.0
                if cat in candidate_levels and level > candidate_levels[cat]:
                    candidate_levels[cat] = level

    total_weighted_achieved = 0.0
    total_possible_weight = 0.0
    gap_breakdown = []
    total_learning_hours = 0.0
    deal_breakers = []

    for cat in RADIX_CATEGORIES:
        try:
            required = float(benchmark.get(cat, 0.0))
        except (ValueError, TypeError):
            required = 0.0

        current = candidate_levels.get(cat, 0.0)
        gap = max(0.0, required - current)
        weight = CATEGORY_WEIGHTS.get(cat, 1.0)
        hours_per_level = SKILL_COMPLEXITY_HOURS.get(cat, 10)
        estimated_hours = round(gap * hours_per_level, 1)
        total_learning_hours += estimated_hours

        achieved_ratio = min(current, required) / required if required > 0 else 1.0
        total_weighted_achieved += achieved_ratio * weight
        total_possible_weight += weight

        is_deal_breaker = gap >= 1.5
        if is_deal_breaker:
            deal_breakers.append({
                "category": cat,
                "current": round(current, 1),
                "required": round(required, 1),
                "gap": round(gap, 1)
            })

        gap_breakdown.append({
            "category": cat,
            "required_level": round(required, 1),
            "candidate_level": round(current, 1),
            "gap": round(gap, 1),
            "estimated_learning_hours": estimated_hours,
            "is_deal_breaker": is_deal_breaker,
            "weight": weight
        })

    readiness_score = round((total_weighted_achieved / total_possible_weight) * 100, 1) if total_possible_weight > 0 else 0.0
    is_ready = (readiness_score >= 75.0) and (len(deal_breakers) == 0)

    best_roi_skill = None
    max_score_boost = 0.0

    for item in gap_breakdown:
        if item["gap"] > 0:
            cat = item["category"]
            weight = item["weight"]
            required = item["required_level"]
            current = item["candidate_level"]
            simulated_current = min(current + 1.0, required)
            gain_ratio = (simulated_current - current) / required if required > 0 else 0
            score_boost = round((gain_ratio * weight / total_possible_weight) * 100, 1)
            if score_boost > max_score_boost:
                max_score_boost = score_boost
                best_roi_skill = cat

    ai_coach_advice = (
        f"This is an informational comparison with {matched_company_key}'s available company benchmark. "
        "Resume mentions provide evidence to review, but they do not establish skill proficiency or predict a hiring outcome. "
        "Use a practical assessment to validate skills, and treat benchmark differences as areas to explore."
    )

    gap_breakdown.sort(key=lambda x: x["gap"], reverse=True)

    skillset_gap_contract = [
        {
            "category_code": item["category"],
            "required_level": item["required_level"],
            "candidate_level": item["candidate_level"],
            "gap": item["gap"] > 0
        }
        for item in gap_breakdown
    ]

    return {
        "error": False,
        "company": matched_company_key,
        "target_company": matched_company_key,
        "candidate_name": candidate_name,
        "readiness_score": readiness_score,
        "is_ready": is_ready,
        "readiness_threshold": 75.0,
        "total_estimated_learning_hours": round(total_learning_hours, 1),
        "deal_breakers_count": len(deal_breakers),
        "deal_breakers_list": deal_breakers,
        "what_if_recommendation": {
            "recommended_skill_to_study": best_roi_skill,
            "projected_score_boost_pct": max_score_boost
        },
        "ai_candidate_agent_advice": ai_coach_advice,
        "skillset_gap": skillset_gap_contract,
        "per_skillset_gap_breakdown": gap_breakdown
    }

def get_radar_chart_data(talent_check_output):
    if talent_check_output.get("error"):
        return []
    radar_data = []
    for item in talent_check_output.get("per_skillset_gap_breakdown", []):
        radar_data.append({
            "category": item["category"],
            "Candidate": item["candidate_level"],
            "CompanyGoal": item["required_level"],
            "fullMark": 5.0
        })
    return radar_data
