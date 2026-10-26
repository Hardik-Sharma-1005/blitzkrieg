# Shared RADIX categories and a checked-in snapshot of the connected 118-company directory.
import json
from pathlib import Path

RADIX_CATEGORIES = [
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"
]

sample_candidate = {
    "candidate_id": "cand_001",
    "name": "Rohan Verma",
    "email": "rohan.verma@example.com",
    "skills": [
        {"skill_name": "Python", "category_code": "CDG", "level": 4.2},
        {"skill_name": "C++", "category_code": "CDG", "level": 3.8},
        {"skill_name": "Data Structures", "category_code": "DSA", "level": 3.5},
        {"skill_name": "Object-Oriented Programming", "category_code": "OOD", "level": 3.8},
        {"skill_name": "Git & GitHub", "category_code": "SWE", "level": 4.0},
        {"skill_name": "Docker & AWS", "category_code": "CLOUD", "level": 2.5},
        {"skill_name": "System Design Basics", "category_code": "SYSD", "level": 1.5},
        {"skill_name": "Linux / Shell Scripting", "category_code": "OS", "level": 3.0},
        {"skill_name": "Computer Networks", "category_code": "NETW", "level": 2.8},
        {"skill_name": "Aptitude & Logic", "category_code": "APTI", "level": 4.0},
        {"skill_name": "Technical Communication", "category_code": "COMM", "level": 3.5},
        {"skill_name": "Team Leadership", "category_code": "EQ", "level": 3.8},
        {"skill_name": "Machine Learning Fundamentals", "category_code": "AI", "level": 2.0}
    ]
}

_benchmark_data_path = Path(__file__).resolve().parents[2] / "data" / "radix_company_benchmarks.json"
_benchmark_data = json.loads(_benchmark_data_path.read_text(encoding="utf-8"))
company_records = _benchmark_data["companies"]
company_benchmarks = {record["name"]: record["benchmark"] for record in company_records}
company_benchmarks_by_id = {record["company_id"]: record for record in company_records}
company_benchmark_metadata = _benchmark_data

# Keep compatibility with existing standalone demos that reference `sample_candidate`.
sample_candidate["skills"] = [
    {**skill, "category_code": "COD" if skill.get("category_code") == "CDG" else skill.get("category_code")}
    for skill in sample_candidate["skills"]
    if skill.get("category_code") != "EQ"
]
