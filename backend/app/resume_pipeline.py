"""
RADIX Talent Match Hackathon - Candidate Resume Pipeline (Role 2)
Coordinates resume parsing, guardrail checks, and skill extraction
to produce the standardized Candidate Profile JSON for Role 3 Profile Builder.
"""

import json
import os
from typing import Any, Dict, Optional

try:
    from app.document_parser import ResumeDocumentParser
    from app.llm_extractor import ResumeSkillExtractor
    from app.schemas import CandidateProfile
except ImportError:
    from backend.app.document_parser import ResumeDocumentParser
    from backend.app.llm_extractor import ResumeSkillExtractor
    from backend.app.schemas import CandidateProfile


class ResumePipeline:
    """Unified Resume Parsing Pipeline for Role 2."""

    def __init__(
        self,
        parser: Optional[ResumeDocumentParser] = None,
        extractor: Optional[ResumeSkillExtractor] = None,
    ):
        self.parser = parser or ResumeDocumentParser(x_tolerance=2.0, y_tolerance=3.0)
        self.extractor = extractor or ResumeSkillExtractor()

    @staticmethod
    def skill_text(parsed: Dict[str, Any]) -> str:
        sections = parsed.get("sections", {})
        skill_text_parts = []
        if sections.get("technical_skills"):
            skill_text_parts.append(
                "### Technical Skills\n" + "\n".join(sections["technical_skills"])
            )
        if sections.get("projects"):
            skill_text_parts.append(
                "### Projects\n" + "\n".join(sections["projects"])
            )
        if sections.get("hackathons_and_internships"):
            skill_text_parts.append(
                "### Experience & Hackathons\n"
                + "\n".join(sections["hackathons_and_internships"])
            )
        if sections.get("achievements"):
            skill_text_parts.append(
                "### Achievements\n" + "\n".join(sections["achievements"])
            )

        return (
            "\n\n".join(skill_text_parts)
            if skill_text_parts
            else parsed.get("raw_text", "")
        )

    @staticmethod
    def build_profile(
        parsed: Dict[str, Any],
        extraction_result: Dict[str, Any],
        source_filename: Optional[str] = None,
        output_json_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        profile_data = {
            "source_type": "resume",
            "source_file": os.path.basename(source_filename) if source_filename else parsed["source_file"],
            "cv_file": os.path.basename(source_filename) if source_filename else parsed["cv_file"],
            "name": parsed["name"],
            "email": parsed["email"],
            "phone": parsed.get("phone", ""),
            "location": parsed.get("location", ""),
            "linkedin": parsed.get("linkedin", ""),
            "github": parsed.get("github", ""),
            "education": parsed["education"],
            "projects": parsed["projects"],
            "hackathons": parsed["hackathons"],
            "internships": parsed["internships"],
            "certifications": parsed["certifications"],
            "achievements": parsed["achievements"],
            "preferred_roles": parsed["preferred_roles"],
            "skills": extraction_result.get("skills", []),
            "extraction_mode": extraction_result.get("mode", "offline_heuristic"),
        }

        if output_json_path:
            os.makedirs(os.path.dirname(os.path.abspath(output_json_path)), exist_ok=True)
            with open(output_json_path, "w", encoding="utf-8") as f:
                json.dump(profile_data, f, indent=2)

        return profile_data

    def process_resume(
        self,
        file_path: str,
        output_json_path: Optional[str] = None,
        validate_type: bool = True,
        source_filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Resume file not found: {file_path}")

        parsed = self.parser.parse(file_path)
        extraction_result = self.extractor.extract_skills(self.skill_text(parsed))
        return self.build_profile(
            parsed,
            extraction_result,
            source_filename=source_filename,
            output_json_path=output_json_path,
        )


def parse_and_extract_resume(
    file_path: str,
    output_json_path: Optional[str] = None,
) -> Dict[str, Any]:
    pipeline = ResumePipeline()
    return pipeline.process_resume(
        file_path=file_path, output_json_path=output_json_path
    )
