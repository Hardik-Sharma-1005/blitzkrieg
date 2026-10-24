"""
RADIX Talent Match Hackathon - Candidate Profile & Skill Schemas (Role 2)
Defines Pydantic data contracts for Resume Parsing and Role 3 handoff.
"""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# 1. RADIX Skill Taxonomy Codes
# ---------------------------------------------------------------------------

CategoryCode = Literal[
    "COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL",
    "SWE", "SYSD", "NETW", "OS", "OTHER",
]
RadixCategory = CategoryCode
Confidence = Literal["high", "medium", "low"]


# ---------------------------------------------------------------------------
# 2. Skill Extraction Schemas
# ---------------------------------------------------------------------------

class Skill(BaseModel):
    """An individual extracted candidate skill mapped to the 12 RADIX categories."""

    model_config = ConfigDict(extra="forbid")

    skill_name: str = Field(min_length=1, max_length=120)
    category_code: CategoryCode
    evidence: str = Field(min_length=1, max_length=500)
    confidence: Confidence = "high"


ExtractedSkill = Skill


class SkillExtractionResponse(BaseModel):
    """Container schema for structured LLM extraction response."""

    skills: List[Skill] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# 3. Candidate Profile Schemas (Role 3 Data Contract)
# ---------------------------------------------------------------------------

class CandidateProfile(BaseModel):
    """Full candidate profile schema matching the Role 3 Profile Builder contract."""

    source_type: Literal["resume"] = "resume"
    source_file: str
    cv_file: str
    name: str
    email: str = ""
    education: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    projects: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    hackathons: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    internships: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    preferred_roles: List[str] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
    extraction_mode: str = "offline_heuristic"


class HealthCheckResponse(BaseModel):
    ok: bool = True
    role: str = "Role 2 - Resume Parsing"
    parsers: List[str] = Field(default_factory=list)
