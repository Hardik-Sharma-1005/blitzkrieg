"""
RADIX Talent Match Hackathon - Candidate Profile & Skill Schemas (Role 2)
Defines Pydantic data contracts for Resume Parsing and Role 3 handoff.
"""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# 1. RADIX Skill Taxonomy Codes
# ---------------------------------------------------------------------------

RadixCategory = Literal[
    "COD",    # Coding & General Programming Languages
    "DSA",    # Data Structures & Algorithms
    "OOD",    # Object-Oriented Design & Principles
    "APTI",   # General Aptitude & Problem Solving
    "COMM",   # Communication & Soft Skills
    "AI",     # Artificial Intelligence & Machine Learning
    "CLOUD",  # Cloud & DevOps
    "SQL",    # Databases & Data Management
    "SWE",    # Software Engineering Best Practices
    "SYSD",   # System Design & Architecture
    "NETW",   # Computer Networks & Web Protocols
    "OS",     # Operating Systems & Low-Level Computing
    "OTHER",  # Other Technical Domain Tools
]


# ---------------------------------------------------------------------------
# 2. Skill Extraction Schemas
# ---------------------------------------------------------------------------

class ExtractedSkill(BaseModel):
    """An individual extracted candidate skill mapped to the 12 RADIX categories."""

    skill_name: str = Field(
        description="The exact name of the skill or technology (e.g., Python, Docker, Redis)."
    )
    category_code: RadixCategory = Field(
        description="The RADIX category code (COD, DSA, OOD, APTI, COMM, AI, CLOUD, SQL, SWE, SYSD, NETW, OS, OTHER)."
    )
    evidence: str = Field(
        description="A short quote from the resume proving this skill."
    )
    confidence: Literal["high", "medium", "low"] = Field(
        default="high",
        description="Confidence level of the extraction.",
    )


class SkillExtractionResponse(BaseModel):
    """Container schema for structured LLM extraction response."""

    skills: List[ExtractedSkill] = Field(
        default_factory=list,
        description="List of all extracted candidate skills with taxonomy categories.",
    )


# ---------------------------------------------------------------------------
# 3. Candidate Profile Schemas (Role 3 Data Contract)
# ---------------------------------------------------------------------------

class CandidateProfile(BaseModel):
    """Full candidate profile schema matching the Role 3 Profile Builder contract."""

    source_type: str = "resume"
    source_file: str
    cv_file: str
    name: str
    email: str
    education: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    projects: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    hackathons: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    internships: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    preferred_roles: List[str] = Field(default_factory=list)
    skills: List[ExtractedSkill] = Field(default_factory=list)
    extraction_mode: str = "offline_heuristic"


class HealthCheckResponse(BaseModel):
    status: str
    role: str
    available_parsers: List[str]
