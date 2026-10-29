"""Local, deterministic JD skill extraction used when AI providers are unavailable."""

from __future__ import annotations

import re
from typing import Any


# This intentionally recognizes explicit skills and named tools only. It does not
# infer requirements from a job title or claim that the list is exhaustive.
JD_SKILL_PATTERNS: list[tuple[str, str, str]] = [
    # Programming languages and web technologies
    (r"(?<!\w)Python(?!\w)", "Python", "COD"),
    (r"(?<!\w)JavaScript(?!\w)|(?<!\w)JS(?!\w)", "JavaScript", "COD"),
    (r"(?<!\w)TypeScript(?!\w)", "TypeScript", "COD"),
    (r"(?<!\w)Java(?!\w)", "Java", "COD"),
    (r"(?<!\w)C\+\+(?!\w)", "C++", "COD"),
    (r"(?<!\w)C#(?!\w)", "C#", "COD"),
    (r"(?<!\w)Go(?:lang)?(?!\w)", "Go", "COD"),
    (r"(?<!\w)Rust(?!\w)", "Rust", "COD"),
    (r"(?<!\w)Kotlin(?!\w)", "Kotlin", "COD"),
    (r"(?<!\w)Swift(?!\w)", "Swift", "COD"),
    (r"(?<!\w)PHP(?!\w)", "PHP", "COD"),
    (r"(?<!\w)Ruby(?!\w)", "Ruby", "COD"),
    (r"(?<!\w)React(?:\.js|JS)?(?!\w)", "React", "COD"),
    (r"(?<!\w)Angular(?!\w)", "Angular", "COD"),
    (r"(?<!\w)Vue(?:\.js|JS)?(?!\w)", "Vue", "COD"),
    (r"(?<!\w)Node(?:\.js|JS)(?!\w)", "Node.js", "COD"),
    (r"(?<!\w)Express(?:\.js|JS)?(?!\w)", "Express", "COD"),
    (r"(?<!\w)Django(?!\w)", "Django", "COD"),
    (r"(?<!\w)Flask(?!\w)", "Flask", "COD"),
    (r"(?<!\w)FastAPI(?!\w)", "FastAPI", "COD"),
    (r"(?<!\w)Spring Boot(?!\w)", "Spring Boot", "COD"),
    (r"(?<!\w)\.NET(?!\w)", ".NET", "COD"),
    (r"(?<!\w)HTML5?(?!\w)", "HTML", "COD"),
    (r"(?<!\w)CSS3?(?!\w)", "CSS", "COD"),
    # Databases and data
    (r"(?<!\w)SQL(?!\w)", "SQL", "SQL"),
    (r"(?<!\w)PostgreSQL(?!\w)|(?<!\w)Postgres(?!\w)", "PostgreSQL", "SQL"),
    (r"(?<!\w)MySQL(?!\w)", "MySQL", "SQL"),
    (r"(?<!\w)MongoDB(?!\w)", "MongoDB", "SQL"),
    (r"(?<!\w)Redis(?!\w)", "Redis", "SYSD"),
    (r"(?<!\w)Elasticsearch(?!\w)", "Elasticsearch", "SQL"),
    (r"(?<!\w)Apache Spark(?!\w)|(?<!\w)PySpark(?!\w)", "Apache Spark", "AI"),
    (r"(?<!\w)Hadoop(?!\w)", "Hadoop", "AI"),
    # AI and analytics
    (r"(?<!\w)Machine Learning(?!\w)|(?<!\w)ML(?!\w)", "Machine Learning", "AI"),
    (r"(?<!\w)Artificial Intelligence(?!\w)|(?<!\w)AI(?!\w)", "Artificial Intelligence", "AI"),
    (r"(?<!\w)Deep Learning(?!\w)", "Deep Learning", "AI"),
    (r"(?<!\w)NLP(?!\w)|Natural Language Processing", "Natural Language Processing", "AI"),
    (r"(?<!\w)TensorFlow(?!\w)", "TensorFlow", "AI"),
    (r"(?<!\w)PyTorch(?!\w)", "PyTorch", "AI"),
    (r"(?<!\w)scikit-learn(?!\w)|(?<!\w)sklearn(?!\w)", "scikit-learn", "AI"),
    (r"(?<!\w)pandas(?!\w)", "pandas", "AI"),
    (r"(?<!\w)NumPy(?!\w)", "NumPy", "AI"),
    (r"(?<!\w)Statistics?(?!\w)|(?<!\w)statistical analysis(?!\w)", "Statistics", "APTI"),
    # Cloud, infrastructure, and systems
    (r"(?<!\w)AWS(?!\w)|Amazon Web Services", "AWS", "CLOUD"),
    (r"(?<!\w)Azure(?!\w)", "Azure", "CLOUD"),
    (r"(?<!\w)GCP(?!\w)|Google Cloud(?: Platform)?", "Google Cloud", "CLOUD"),
    (r"(?<!\w)Docker(?!\w)", "Docker", "CLOUD"),
    (r"(?<!\w)Kubernetes(?!\w)|(?<!\w)K8s(?!\w)", "Kubernetes", "CLOUD"),
    (r"(?<!\w)CI/CD(?!\w)", "CI/CD", "CLOUD"),
    (r"(?<!\w)Linux(?!\w)", "Linux", "OS"),
    (r"(?<!\w)Windows(?!\w)", "Windows", "OS"),
    (r"(?<!\w)Operating Systems?(?!\w)", "Operating Systems", "OS"),
    (r"(?<!\w)TCP/IP(?!\w)", "TCP/IP", "NETW"),
    (r"(?<!\w)HTTP(?:S)?(?!\w)", "HTTP", "NETW"),
    (r"(?<!\w)REST(?:ful)? API(?:s)?(?!\w)", "REST APIs", "NETW"),
    (r"(?<!\w)GraphQL(?!\w)", "GraphQL", "NETW"),
    (r"(?<!\w)Networking(?!\w)|Computer Networks", "Networking", "NETW"),
    # Engineering practices and core RADIX capabilities
    (r"Data Structures(?: and| &) Algorithms|(?<!\w)DSA(?!\w)", "Data Structures & Algorithms", "DSA"),
    (r"(?<!\w)Algorithms?(?!\w)", "Algorithms", "DSA"),
    (r"Object[- ]Oriented (?:Programming|Design)|(?<!\w)OOP(?!\w)|(?<!\w)OOD(?!\w)", "Object-Oriented Design", "OOD"),
    (r"Design Patterns", "Design Patterns", "OOD"),
    (r"(?<!\w)SOLID principles", "SOLID Principles", "OOD"),
    (r"System Design", "System Design", "SYSD"),
    (r"Microservices", "Microservices", "SYSD"),
    (r"Distributed Systems", "Distributed Systems", "SYSD"),
    (r"(?<!\w)Git(?!\w)", "Git", "SWE"),
    (r"(?<!\w)Agile(?!\w)|(?<!\w)Scrum(?!\w)", "Agile / Scrum", "SWE"),
    (r"Software Testing|Unit Testing|Integration Testing|Automated Testing|(?<!\w)pytest(?!\w)|(?<!\w)Jest(?!\w)", "Software Testing", "SWE"),
    (r"Code Review", "Code Review", "SWE"),
    (r"Software Development Life Cycle|(?<!\w)SDLC(?!\w)", "Software Development Lifecycle", "SWE"),
    (r"(?<!\w)Communication skills?(?!\w)", "Communication Skills", "COMM"),
    (r"(?<!\w)Presentation skills?(?!\w)", "Presentation Skills", "COMM"),
    (r"Cross[- ]functional collaboration", "Cross-functional Collaboration", "COMM"),
    (r"Problem[- ]solving", "Problem Solving", "APTI"),
    (r"Analytical skills?|Analytical thinking", "Analytical Skills", "APTI"),
    (r"(?<!\w)Excel(?!\w)", "Excel", "OTHER"),
    (r"(?<!\w)Power BI(?!\w)", "Power BI", "OTHER"),
]


def _evidence_window(text: str, start: int, end: int) -> str:
    left = max(text.rfind("\n", 0, start), text.rfind(".", 0, start), text.rfind(";", 0, start)) + 1
    delimiters = [index for token in ("\n", ".", ";") if (index := text.find(token, end)) >= 0]
    right = min(delimiters) if delimiters else len(text)
    quote = text[left:right].strip(" \t\r\n-•|:")
    if len(quote) > 500:
        match_start = max(0, start - left - 200)
        quote = text[left + match_start:left + match_start + 500].strip()
    return quote if quote and quote in text else text[start:end]


def _labeled_value(text: str, labels: tuple[str, ...]) -> str:
    label_pattern = "|".join(re.escape(label) for label in labels)
    match = re.search(rf"^\s*(?:{label_pattern})\s*[:\-–]\s*(.+?)\s*$", text, re.IGNORECASE | re.MULTILINE)
    return match.group(1).strip()[:200] if match else ""


def extract_jd_fallback(text: str, company_hint: str = "", role_hint: str = "") -> dict[str, Any]:
    """Extract explicit skill mentions from JD text without network or AI services."""
    skills: list[dict[str, str]] = []
    seen: set[str] = set()
    for pattern, skill_name, category_code in JD_SKILL_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        key = skill_name.casefold()
        if not match or key in seen:
            continue
        evidence = _evidence_window(text, match.start(), match.end())
        if not evidence:
            continue
        seen.add(key)
        skills.append({
            "skill_name": skill_name,
            "category_code": category_code,
            "evidence": evidence,
            "confidence": "high",
        })

    seen_names = {item["skill_name"].casefold() for item in skills}
    generic = {
        "the", "this", "that", "our", "your", "their", "software", "development",
        "engineering", "experience", "knowledge", "skills", "proficiency", "familiarity",
        "using", "working", "required", "preferred",
    }
    cue = re.compile(
        r"\b(?:experience|proficiency|proficient|familiarity|knowledge|skills?)\s+(?:with|in|of|using)\s+([^.;\n]+)",
        re.IGNORECASE,
    )
    for clause_match in cue.finditer(text):
        clause = clause_match.group(1)
        clause = re.split(
            r"\b(?:such as|including|for example)\b",
            clause,
            maxsplit=1,
            flags=re.IGNORECASE,
        )[0]
        for phrase in re.split(r"[,;]|\s+\b(?:and|or)\b\s+", clause, flags=re.IGNORECASE):
            candidate = phrase.strip(" \t\r\n-–—:()[]")
            candidate = re.sub(
                r"\s+\b(?:is|are|will be)\s+(?:required|preferred|mandatory|a plus|an advantage)\b.*$",
                "",
                candidate,
                flags=re.IGNORECASE,
            ).strip()
            candidate = re.sub(r"^(?:a|an|the)\s+", "", candidate, flags=re.IGNORECASE)
            if not candidate or len(candidate) > 80 or candidate.casefold() in generic or len(candidate.split()) > 4:
                continue
            words = [word.strip(".,:()[]") for word in candidate.split()]
            if not any(
                word and (word[0].isupper() or re.search(r"[0-9.+#/_]", word))
                for word in words
            ):
                continue
            key = candidate.casefold()
            if key in seen_names or any(
                re.search(pattern, candidate, re.IGNORECASE)
                for pattern, _, _ in JD_SKILL_PATTERNS
            ):
                continue
            start, end = clause_match.span(1)
            while start < end and text[start].isspace():
                start += 1
            evidence = _evidence_window(text, start, end)
            if not evidence or evidence not in text:
                continue
            seen_names.add(key)
            skills.append({
                "skill_name": candidate,
                "category_code": "OTHER",
                "evidence": evidence,
                "confidence": "high",
            })

    return {
        "company": company_hint or _labeled_value(text, ("Company", "Employer")),
        "role": role_hint or _labeled_value(text, ("Job Title", "Position", "Role")),
        "skills": skills,
    }
