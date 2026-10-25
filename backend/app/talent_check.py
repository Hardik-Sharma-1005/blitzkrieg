# talent_check.py

try:
    from .mock_data import BENCHMARK_SOURCE, RADIX_CATEGORIES
except ImportError:
    from mock_data import BENCHMARK_SOURCE, RADIX_CATEGORIES

CATEGORY_WEIGHTS = {
    "COD": 1.4, "DSA": 1.4, "SYSD": 1.3, "SWE": 1.2,
    "OOD": 1.1, "CLOUD": 1.1, "AI": 1.0, "APTI": 1.0,
    "OS": 0.9, "NETW": 0.9, "COMM": 0.8, "SQL": 1.0, "OTHER": 0.8
}

SKILL_COMPLEXITY_HOURS = {
    "SYSD": 15, "DSA": 15, "AI": 15,
    "COD": 10, "OOD": 10, "CLOUD": 10, "OS": 10, "NETW": 10,
    "SWE": 5, "APTI": 5, "COMM": 5, "SQL": 10, "OTHER": 5
}

CATEGORY_ALIASES = {"CDG": "COD"}

def normalize_candidate_skills(candidate_profile: dict) -> dict:
    """Normalize legacy category names while leaving proficiency to student ratings."""
    if not isinstance(candidate_profile, dict):
        return {}
    profile = dict(candidate_profile)
    raw_skills = candidate_profile.get("skills", [])
    if not isinstance(raw_skills, list):
        return profile

    normalized_skills = []
    for s in raw_skills:
        if not isinstance(s, dict):
            continue
        cat = str(s.get("category_code", "OTHER")).upper().strip()
        cat = CATEGORY_ALIASES.get(cat, cat)
        normalized_skills.append({**s, "category_code": cat})

    profile["skills"] = normalized_skills
    return profile

def run_talent_check(candidate_profile, company_name, company_benchmarks, skill_ratings):
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

    if not isinstance(skill_ratings, dict):
        raise ValueError("Student 1–5 ratings are required before scoring.")

    candidate_levels = {}
    for raw_category, raw_level in skill_ratings.items():
        category = CATEGORY_ALIASES.get(str(raw_category).upper().strip(), str(raw_category).upper().strip())
        try:
            level = int(raw_level)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Provide a whole-number 1–5 rating for {category}.") from exc
        if isinstance(raw_level, bool) or level != raw_level or category not in RADIX_CATEGORIES or not 1 <= level <= 5:
            raise ValueError(f"Provide a whole-number 1–5 rating for a valid RADIX category; received {category}.")
        candidate_levels[category] = float(level)

    assessed_categories = [
        category for category in RADIX_CATEGORIES
        if company_benchmarks[matched_company_key].get(category) is not None
    ]
    missing_ratings = [category for category in assessed_categories if category not in candidate_levels]
    if missing_ratings:
        raise ValueError(
            "Student 1–5 ratings are required for these categories before scoring: "
            + ", ".join(missing_ratings)
        )

    for category in RADIX_CATEGORIES:
        candidate_levels.setdefault(category, 0.0)

    total_weighted_achieved = 0.0
    total_possible_weight = 0.0
    gap_breakdown = []
    total_learning_hours = 0.0
    deal_breakers = []

    for cat in RADIX_CATEGORIES:
        raw_required = benchmark.get(cat)
        if raw_required is None:
            continue
        required = float(raw_required)

        current = candidate_levels.get(cat, 0.0)
        gap = max(0.0, required - current)
        weight = CATEGORY_WEIGHTS.get(cat, 1.0)
        hours_per_level = SKILL_COMPLEXITY_HOURS.get(cat, 10)
        estimated_hours = round(gap * hours_per_level, 1)
        total_learning_hours += estimated_hours

        achieved_ratio = min(current, required) / required if required > 0 else 1.0
        total_weighted_achieved += achieved_ratio * weight
        total_possible_weight += weight

        is_deal_breaker = (gap >= 1.5) and (weight >= 1.2)
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

    if is_ready:
        ai_coach_advice = f"In this illustrative demo comparison, {candidate_name} scored {readiness_score}% against the {matched_company_key} sample benchmark and has no deal-breaker gaps. This is not an employer readiness decision."
    else:
        deal_breaker_text = ""
        if deal_breakers:
            top_db = deal_breakers[0]
            deal_breaker_text = f" Your top deal-breaker risk is {top_db['category']} (Gap: {top_db['gap']} levels)."
        roi_text = ""
        if best_roi_skill:
            roi_text = f" Quick Win Tip: Level up {best_roi_skill} by +1.0 to immediately boost your score by +{max_score_boost}%!"
        ai_coach_advice = f"In this illustrative demo comparison, {candidate_name} scored {readiness_score}% against the {matched_company_key} sample benchmark.{deal_breaker_text} The estimated study time and recommendation are illustrative, not a hiring decision.{roi_text}"

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
        "benchmark_source": BENCHMARK_SOURCE,
        "benchmark_notice": "Illustrative demo benchmarks only; these are not verified employer requirements.",
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
