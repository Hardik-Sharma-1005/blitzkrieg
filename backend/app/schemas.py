"""Shared Pydantic contracts for JD and resume analysis handoffs."""

from typing import Any, Dict, List, Literal, Union

from pydantic import BaseModel, ConfigDict, Field

CategoryCode = Literal[
    "COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL",
    "SWE", "SYSD", "NETW", "OS", "OTHER",
]
RadixCategory = CategoryCode
Confidence = Literal["high", "medium", "low"]
ExtractionMode = Literal["llm_live", "offline_heuristic", "offline_heuristic_fallback"]


class Skill(BaseModel):
    """A resume skill mapped to one RADIX category and backed by source text."""

    model_config = ConfigDict(extra="forbid")

    skill_name: str = Field(min_length=1, max_length=120)
    category_code: CategoryCode
    evidence: str = Field(min_length=1, max_length=500)
    confidence: Confidence = "high"


ExtractedSkill = Skill


class SkillExtractionResponse(BaseModel):
    """Structured response requested from the optional LLM provider."""

    model_config = ConfigDict(extra="forbid")

    skills: List[Skill] = Field(default_factory=list)


class CandidateProfile(BaseModel):
    """Candidate profile handoff from Resume Parsing to Profile Builder."""

    model_config = ConfigDict(extra="forbid")

    source_type: Literal["resume"] = "resume"
    source_file: str = Field(min_length=1)
    cv_file: str = Field(min_length=1)
    name: str = Field(min_length=1)
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    education: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    projects: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    hackathons: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    internships: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    preferred_roles: List[str] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
    extraction_mode: ExtractionMode = "offline_heuristic"


class HealthCheckResponse(BaseModel):
    ok: bool = True
    services: Dict[str, bool] = Field(default_factory=dict)
    providers: Dict[str, bool] = Field(default_factory=dict)
