"""Compatibility exports for the canonical backend resume schemas."""

try:
    from backend.app.schemas import (
        CandidateProfile,
        CategoryCode,
        HealthCheckResponse,
        Skill as ExtractedSkill,
        SkillExtractionResponse,
    )
except ImportError:
    from app.schemas import (
        CandidateProfile,
        CategoryCode,
        HealthCheckResponse,
        Skill as ExtractedSkill,
        SkillExtractionResponse,
    )

RadixCategory = CategoryCode

__all__ = [
    "CandidateProfile",
    "ExtractedSkill",
    "HealthCheckResponse",
    "RadixCategory",
    "SkillExtractionResponse",
]
