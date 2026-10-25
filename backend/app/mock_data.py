# Illustrative demo benchmarks only. They are not verified employer requirements.

RADIX_CATEGORIES = [
    "COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD",
    "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"
]

BENCHMARK_SOURCE = "illustrative_mock_data"

sample_candidate = {
    "candidate_id": "cand_001",
    "name": "Rohan Verma",
    "email": "rohan.verma@example.com",
    "skills": [
        {"skill_name": "Python", "category_code": "COD"},
        {"skill_name": "C++", "category_code": "COD"},
        {"skill_name": "Data Structures", "category_code": "DSA"},
        {"skill_name": "Object-Oriented Programming", "category_code": "OOD"},
        {"skill_name": "Git & GitHub", "category_code": "SWE"},
        {"skill_name": "Docker & AWS", "category_code": "CLOUD"},
        {"skill_name": "System Design Basics", "category_code": "SYSD"},
        {"skill_name": "Linux / Shell Scripting", "category_code": "OS"},
        {"skill_name": "Computer Networks", "category_code": "NETW"},
        {"skill_name": "Aptitude & Logic", "category_code": "APTI"},
        {"skill_name": "Technical Communication", "category_code": "COMM"},
        {"skill_name": "Team Leadership", "category_code": "OTHER"},
        {"skill_name": "Machine Learning Fundamentals", "category_code": "AI"}
    ]
}

# Test-only self-ratings; real students must provide their own ratings.
sample_skill_ratings = {
    "COD": 4, "DSA": 4, "OOD": 4, "APTI": 4, "COMM": 4,
    "AI": 2, "CLOUD": 3, "SWE": 4, "SYSD": 2, "NETW": 3, "OS": 3
}

company_benchmarks = {
    "Google": {
        "COD": 4.5, "DSA": 4.5, "OOD": 4.0, "APTI": 4.0,
        "COMM": 3.5, "AI": 3.5, "CLOUD": 3.5, "SWE": 4.0,
        "SYSD": 4.5, "NETW": 3.0, "OS": 3.5, "SQL": None, "OTHER": None
    },
    "Microsoft": {
        "COD": 4.2, "DSA": 4.0, "OOD": 4.2, "APTI": 3.8,
        "COMM": 4.0, "AI": 3.0, "CLOUD": 4.0, "SWE": 4.2,
        "SYSD": 3.8, "NETW": 3.2, "OS": 3.8, "SQL": None, "OTHER": None
    },
    "Oracle": {
        "COD": 4.0, "DSA": 3.8, "OOD": 4.0, "APTI": 3.5,
        "COMM": 3.5, "AI": 2.5, "CLOUD": 4.2, "SWE": 4.0,
        "SYSD": 3.5, "NETW": 3.5, "OS": 3.5, "SQL": None, "OTHER": None
    }
}
