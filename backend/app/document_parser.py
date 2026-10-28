"""
RADIX Talent Match Hackathon - Role 2 (Resume Parsing)
Dedicated Candidate Resume Parser (PDF & DOCX).

Extracts candidate identity, education, projects, separated hackathons & internships,
certifications, achievements, and preferred roles.
Includes upload mismatch guardrails to reject Job Descriptions.
"""

import os
import re
import xml.etree.ElementTree as ET
import zipfile
from typing import Any, Dict, List, Optional


class ResumeDocumentParser:
    """Specialized document parser for Candidate Resumes."""

    RESUME_SECTIONS = {
        "education": [
            "education",
            "academic background",
            "academic history",
            "educational qualifications",
            "academics",
        ],
        "technical_skills": [
            "technical skills",
            "skills",
            "skills & tools",
            "skills & technologies",
            "core competencies",
            "technologies",
            "tech stack",
        ],
        "projects": [
            "projects",
            "academic projects",
            "key projects",
            "personal projects",
            "selected projects",
        ],
        "hackathons_and_internships": [
            "hackathons / internships",
            "hackathons & internships",
            "hackathons and internships",
            "experience",
            "internships & experience",
            "work experience",
            "internships",
            "hackathons",
        ],
        "certifications": [
            "certifications",
            "certifications & courses",
            "licenses & certifications",
            "certificates",
        ],
        "achievements": [
            "achievements",
            "honors & awards",
            "awards",
            "extracurricular achievements",
            "accomplishments",
        ],
        "preferred_roles": [
            "preferred roles",
            "roles of interest",
            "target roles",
            "career interests",
            "preferred positions",
        ],
    }

    JD_INDICATORS = [
        "role overview",
        "about the role",
        "key responsibilities",
        "what you'll do",
        "what we're looking for",
        "what were looking for",
        "nice to have",
        "perks & benefits",
        "benefits",
    ]

    NOISE_PATTERNS = [
        re.compile(
            r"RADIX\s+Talent\s+Match\s+Hackathon[\s\·\-\–\—\•\*\.\:\/]*Test\s+Data",
            re.IGNORECASE,
        ),
        re.compile(r"^Page\s+\d+(\s+of\s+\d+)?$", re.IGNORECASE),
        re.compile(r"^\s*-\s*\d+\s*-\s*$", re.IGNORECASE),
    ]

    NULL_CERTIFICATION_PATTERNS = [
        re.compile(r"^\s*none\s+listed\s*$", re.IGNORECASE),
        re.compile(r"^\s*none\s*$", re.IGNORECASE),
        re.compile(
            r"^\s*self-taught\s+via\s+applied\s+projects[;,]?\s*no\s+formal\s+certifications\s+listed\s*$",
            re.IGNORECASE,
        ),
        re.compile(r"^\s*no\s+formal\s+certifications\s+listed\s*$", re.IGNORECASE),
        re.compile(r"^\s*no\s+certifications\s+listed\s*$", re.IGNORECASE),
        re.compile(r"^\s*n/?a\s*$", re.IGNORECASE),
        re.compile(r"^\s*nil\s*$", re.IGNORECASE),
    ]

    def __init__(self, x_tolerance: float = 2.0, y_tolerance: float = 3.0):
        self.x_tolerance = x_tolerance
        self.y_tolerance = y_tolerance

    def clean_text_line(self, line: str) -> Optional[str]:
        text = line.strip()
        if not text:
            return None

        # Some PDF text extractors replace bullet and em-dash glyphs with U+FFFD.
        if text.startswith("\ufffd"):
            text = "•" + text[1:]
        text = text.replace("\ufffd", " — ")

        for pattern in self.NOISE_PATTERNS:
            if pattern.search(text):
                cleaned = pattern.sub("", text).strip()
                if not cleaned:
                    return None
                text = cleaned

        text = text.replace("\u00a0", " ")
        text = re.sub(r"[\u2013\u2014]", " — ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text if text else None

    def _parse_pdf(self, file_path: str) -> List[str]:
        extracted_lines: List[str] = []

        try:
            import pdfplumber

            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text(
                        x_tolerance=self.x_tolerance,
                        y_tolerance=self.y_tolerance,
                        layout=False,
                    )
                    if not text:
                        continue
                    for raw_line in text.split("\n"):
                        cleaned = self.clean_text_line(raw_line)
                        if cleaned:
                            extracted_lines.append(cleaned)
            return extracted_lines
        except ImportError:
            pass

        try:
            import pypdf

            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                text = page.extract_text()
                if not text:
                    continue
                for raw_line in text.split("\n"):
                    cleaned = self.clean_text_line(raw_line)
                    if cleaned:
                        extracted_lines.append(cleaned)
            return extracted_lines
        except ImportError:
            raise ImportError(
                "Neither 'pdfplumber' nor 'pypdf' is installed. "
                "Please install at least one via 'pip install pypdf' or 'pip install pdfplumber'."
            )

    def _parse_docx(self, file_path: str) -> List[str]:
        extracted_lines: List[str] = []
        try:
            import docx
            from docx.oxml.ns import qn
            from docx.table import Table
            from docx.text.paragraph import Paragraph

            document = docx.Document(file_path)
            for child in document.element.body.iterchildren():
                if child.tag == qn("w:p"):
                    paragraph = Paragraph(child, document)
                    raw_lines = [paragraph.text]
                elif child.tag == qn("w:tbl"):
                    table = Table(child, document)
                    raw_lines = [
                        line
                        for row in table.rows
                        for cell in row.cells
                        for line in cell.text.splitlines()
                    ]
                else:
                    continue

                for raw_line in raw_lines:
                    cleaned = self.clean_text_line(raw_line)
                    if cleaned:
                        extracted_lines.append(cleaned)
        except ImportError:
            with zipfile.ZipFile(file_path) as archive:
                xml_content = archive.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                namespaces = {
                    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                }
                for paragraph in tree.iterfind(".//w:p", namespaces):
                    texts = [
                        node.text
                        for node in paragraph.iterfind(".//w:t", namespaces)
                        if node.text
                    ]
                    if texts:
                        cleaned = self.clean_text_line("".join(texts))
                        if cleaned:
                            extracted_lines.append(cleaned)
        return extracted_lines
    def is_valid_resume(self, lines: List[str]) -> bool:
        norm_lines = [
            re.sub(r"[:\-\–\—\*\#]+", "", l.strip().lower()).strip() for l in lines
        ]

        resume_hits = 0
        for aliases in self.RESUME_SECTIONS.values():
            if any(alias in norm_lines for alias in aliases):
                resume_hits += 1

        jd_hits = sum(1 for ind in self.JD_INDICATORS if ind in norm_lines)
        return resume_hits >= 2 and resume_hits >= jd_hits

    def segment_sections(self, lines: List[str]) -> Dict[str, Any]:
        sections: Dict[str, List[str]] = {
            "preamble": [],
            "education": [],
            "technical_skills": [],
            "projects": [],
            "hackathons_and_internships": [],
            "certifications": [],
            "achievements": [],
            "preferred_roles": [],
        }

        current_section = "preamble"

        for line in lines:
            norm = re.sub(r"[:\-\–\—\*\#]+", "", line.strip().lower()).strip()
            matched_key = None
            for canonical_key, aliases in self.RESUME_SECTIONS.items():
                if norm in aliases:
                    matched_key = canonical_key
                    break

            if matched_key:
                current_section = matched_key
                continue

            sections[current_section].append(line)

        return sections

    @staticmethod
    def _merge_wrapped_pdf_items(sections: Dict[str, Any]) -> Dict[str, Any]:
        """Join unbulleted PDF wrap lines to their preceding bullet within each section."""
        bullet_start = re.compile(r"^\s*[•●▪◦*\-–—]\s*")
        for section_name, lines in sections.items():
            if section_name == "preamble":
                continue
            merged: List[str] = []
            previous_was_bulleted = False
            for line in lines:
                is_bulleted = bool(bullet_start.match(line))
                if is_bulleted or not merged or not previous_was_bulleted:
                    merged.append(line)
                else:
                    merged[-1] = f"{merged[-1].rstrip()} {line.strip()}"
                previous_was_bulleted = is_bulleted or (previous_was_bulleted and bool(merged))
            sections[section_name] = merged
        return sections

    def parse(self, file_path: str) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            lines = self._parse_pdf(file_path)
        elif ext == ".docx":
            lines = self._parse_docx(file_path)
        else:
            raise ValueError(
                f"Unsupported format: '{ext}'. Only .pdf and .docx are supported."
            )

        if not self.is_valid_resume(lines):
            raise ValueError(
                f"Document mismatch guardrail triggered: '{os.path.basename(file_path)}' "
                f"appears to be a Job Description, not a Resume. Please upload it via the JD upload path."
            )

        sections = self.segment_sections(lines)
        if ext == ".pdf":
            sections = self._merge_wrapped_pdf_items(sections)
        preamble = sections.get("preamble", [])

        name = preamble[0] if preamble else "Unknown Candidate"
        email = ""
        email_pattern = re.compile(
            r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
        )
        for line in preamble:
            match = email_pattern.search(line)
            if match:
                email = match.group(0)
                break

        contact_text = "\n".join(preamble[:12])
        phone = ""
        phone_pattern = re.compile(r"(?<!\w)(?:\+?\d[\d\s().-]{6,}\d)(?!\w)")
        for line in preamble[:12]:
            if email_pattern.search(line):
                line = email_pattern.sub("", line)
            match = phone_pattern.search(line)
            if match:
                candidate_phone = match.group(0).strip()
                digits = re.sub(r"\D", "", candidate_phone)
                if 7 <= len(digits) <= 15 and not re.fullmatch(r"(?:19|20)\d{2}", digits):
                    phone = candidate_phone
                    break

        linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[^\s|,;]+", contact_text, re.IGNORECASE)
        github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/[^\s|,;]+", contact_text, re.IGNORECASE)
        linkedin = linkedin_match.group(0).rstrip(".)]") if linkedin_match else ""
        github = github_match.group(0).rstrip(".)]") if github_match else ""
        name = email_pattern.sub("", name)
        name = phone_pattern.sub("", name)
        name = re.sub(r"(?:https?://)?(?:www\.)?(?:linkedin|github)\.com/[^\s|,;]+", "", name, flags=re.IGNORECASE)
        name = re.sub(r"^\s*name\s*[:\-]\s*", "", name, flags=re.IGNORECASE)
        name = re.split(r"\s*[|•;]\s*", name, maxsplit=1)[0].strip(" ,|;•\t") or preamble[0].strip()
        location = ""
        for line in preamble[:12]:
            match = re.search(r"\b(?:location|based in|city|address)\s*(?:[:\-–—|]\s*)?(.+)$", line, re.IGNORECASE)
            if match:
                location_value = email_pattern.sub("", match.group(1))
                location_value = phone_pattern.sub("", location_value)
                location_value = re.sub(r"(?:https?://)?(?:www\.)?(?:linkedin|github)\.com/[^\s|,;]+", "", location_value, flags=re.IGNORECASE)
                location = re.split(r"\s*[|•;]\s*", location_value, maxsplit=1)[0].strip(" \t,|;•")[:160]
                break

        def clean_items(items: List[str]) -> List[str]:
            res = []
            for item in items:
                cleaned = re.sub(r"^[\s•\-\*\u2022\u2013\u2014]+", "", item).strip()
                if cleaned:
                    res.append(cleaned)
            return res

        hackathons_raw = clean_items(sections.get("hackathons_and_internships", []))
        hackathons: List[str] = []
        internships: List[str] = []
        intern_keywords = ["intern", "internship", "fellow", "apprentice", "trainee"]

        for item in hackathons_raw:
            lower = item.lower()
            if any(kw in lower for kw in intern_keywords):
                internships.append(item)
            else:
                hackathons.append(item)

        raw_certs = clean_items(sections.get("certifications", []))
        certifications: List[str] = []
        is_all_null = True
        for cert in raw_certs:
            if not any(pat.match(cert) for pat in self.NULL_CERTIFICATION_PATTERNS):
                is_all_null = False
                certifications.append(cert)
        if is_all_null:
            certifications = []

        raw_roles = clean_items(sections.get("preferred_roles", []))
        preferred_roles: List[str] = []
        for line in raw_roles:
            parts = [p.strip() for p in re.split(r",\s*", line) if p.strip()]
            preferred_roles.extend(parts)

        return {
            "source_type": "resume",
            "source_file": os.path.basename(file_path),
            "cv_file": os.path.basename(file_path),
            "name": name,
            "email": email,
            "phone": phone,
            "location": location,
            "linkedin": linkedin,
            "github": github,
            "education": clean_items(sections.get("education", [])),
            "projects": clean_items(sections.get("projects", [])),
            "hackathons": hackathons,
            "internships": internships,
            "certifications": certifications,
            "achievements": clean_items(sections.get("achievements", [])),
            "preferred_roles": preferred_roles,
            "sections": sections,
            "raw_text": "\n".join(lines),
        }
