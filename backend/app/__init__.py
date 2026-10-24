"""
RADIX Talent Match Platform - Role 2 App Package.
"""

try:
    from app.document_parser import ResumeDocumentParser
    from app.llm_extractor import ResumeSkillExtractor
    from app.resume_pipeline import ResumePipeline, parse_and_extract_resume
    from app.main import app, resume_router
    from app.schemas import CandidateProfile, Skill, ExtractedSkill, CategoryCode, RadixCategory
except ImportError:
    from backend.app.document_parser import ResumeDocumentParser
    from backend.app.llm_extractor import ResumeSkillExtractor
    from backend.app.resume_pipeline import ResumePipeline, parse_and_extract_resume
    from backend.app.main import app, resume_router
    from backend.app.schemas import CandidateProfile, Skill, ExtractedSkill, CategoryCode, RadixCategory

__all__ = [
    "ResumeDocumentParser",
    "ResumeSkillExtractor",
    "ResumePipeline",
    "parse_and_extract_resume",
    "app",
    "resume_router",
    "CandidateProfile",
    "Skill",
    "ExtractedSkill",
    "CategoryCode",
    "RadixCategory",
]
