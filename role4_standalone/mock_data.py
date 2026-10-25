# mock_data.py

RADIX_CATEGORIES = [
    "CDG", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "EQ", "SWE", "SYSD", "NETW", "OS"
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

company_benchmarks = {
    "Google": {
        "CDG": 4.5, "DSA": 4.5, "OOD": 4.0, "APTI": 4.0,
        "COMM": 3.5, "AI": 3.5, "CLOUD": 3.5, "EQ": 3.5,
        "SWE": 4.0, "SYSD": 4.5, "NETW": 3.0, "OS": 3.5
    },
    "Microsoft": {
        "CDG": 4.2, "DSA": 4.0, "OOD": 4.2, "APTI": 3.8,
        "COMM": 4.0, "AI": 3.0, "CLOUD": 4.0, "EQ": 4.0,
        "SWE": 4.2, "SYSD": 3.8, "NETW": 3.2, "OS": 3.8
    },
    "Oracle": {
        "CDG": 4.0, "DSA": 3.8, "OOD": 4.0, "APTI": 3.5,
        "COMM": 3.5, "AI": 2.5, "CLOUD": 4.2, "EQ": 3.5,
        "SWE": 4.0, "SYSD": 3.5, "NETW": 3.5, "OS": 3.5
    }
}