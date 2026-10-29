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
from io import BytesIO
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

    def _pdf_page_lines(self, page: Any) -> List[str]:
        """Read PDF words in visual order, preferring column-major order when a gutter is clear."""
        try:
            words = page.extract_words(
                x_tolerance=self.x_tolerance,
                y_tolerance=self.y_tolerance,
                keep_blank_chars=False,
                use_text_flow=False,
            )
        except (AttributeError, TypeError):
            words = []
        if not words:
            text = page.extract_text(x_tolerance=self.x_tolerance, y_tolerance=self.y_tolerance) or ""
            return [line for raw in text.splitlines() if (line := self.clean_text_line(raw))]

        rows: List[dict[str, Any]] = []
        for word in sorted(words, key=lambda item: (float(item.get("top", 0)), float(item.get("x0", 0)))):
            top = float(word.get("top", 0))
            row = next((candidate for candidate in reversed(rows[-3:]) if abs(candidate["top"] - top) <= self.y_tolerance), None)
            if row is None:
                row = {"top": top, "words": []}
                rows.append(row)
            row["words"].append(word)
        for row in rows:
            row["words"].sort(key=lambda item: float(item.get("x0", 0)))

        page_width = float(getattr(page, "width", 0) or 0)
        candidates: List[float] = []
        if page_width:
            for row in rows:
                row_words = row["words"]
                for left, right in zip(row_words, row_words[1:]):
                    gap = float(right.get("x0", 0)) - float(left.get("x1", 0))
                    if gap >= max(22.0, page_width * 0.035):
                        candidates.append((float(right.get("x0", 0)) + float(left.get("x1", 0))) / 2)

        gutter = None
        best_coverage = 0.0
        for cut in candidates:
            coverage = sum(
                1 for row in rows
                if any(float(word.get("x1", 0)) <= cut for word in row["words"])
                and any(float(word.get("x0", 0)) >= cut for word in row["words"])
                and not any(float(word.get("x0", 0)) < cut < float(word.get("x1", 0)) for word in row["words"])
            ) / max(1, len(rows))
            if coverage > best_coverage:
                gutter, best_coverage = cut, coverage

        def row_text(items: List[dict[str, Any]]) -> str:
            return " ".join(str(item.get("text", "")) for item in items).strip()

        if gutter is None or best_coverage < 0.3 or len(rows) < 3:
            ordered_rows = [row_text(row["words"]) for row in rows]
        else:
            ordered_rows = []
            left_band: List[str] = []
            right_band: List[str] = []

            def flush_columns() -> None:
                ordered_rows.extend(line for line in left_band if line)
                ordered_rows.extend(line for line in right_band if line)
                left_band.clear()
                right_band.clear()

            for row in rows:
                row_words = row["words"]
                crosses_gutter = any(float(word.get("x0", 0)) < gutter < float(word.get("x1", 0)) for word in row_words)
                has_left = any(float(word.get("x1", 0)) <= gutter for word in row_words)
                has_right = any(float(word.get("x0", 0)) >= gutter for word in row_words)
                gap_at_gutter = any(
                    float(right.get("x0", 0)) - float(left.get("x1", 0)) >= max(22.0, page_width * 0.035)
                    and abs((float(right.get("x0", 0)) + float(left.get("x1", 0))) / 2 - gutter) <= page_width * 0.06
                    for left, right in zip(row_words, row_words[1:])
                )
                spans_both_columns = has_left and has_right and not gap_at_gutter
                if crosses_gutter or spans_both_columns:
                    flush_columns()
                    ordered_rows.append(row_text(row_words))
                elif has_left and has_right:
                    left_band.append(row_text([word for word in row_words if float(word.get("x1", 0)) <= gutter]))
                    right_band.append(row_text([word for word in row_words if float(word.get("x0", 0)) >= gutter]))
                elif has_left:
                    left_band.append(row_text(row_words))
                elif has_right:
                    right_band.append(row_text(row_words))
                else:
                    ordered_rows.append(row_text(row_words))
            flush_columns()

        return [line for raw in ordered_rows if (line := self.clean_text_line(raw))]

    def _parse_pdf(self, file_path: Any, page_text_overrides: Optional[Dict[int, str]] = None) -> List[str]:
        try:
            import pdfplumber

            extracted_lines: List[str] = []
            with pdfplumber.open(file_path) as pdf:
                for page_index, page in enumerate(pdf.pages):
                    override = (page_text_overrides or {}).get(page_index)
                    page_lines = (
                        [line for raw in override.splitlines() if (line := self.clean_text_line(raw))]
                        if override is not None
                        else self._pdf_page_lines(page)
                    )
                    extracted_lines.extend(page_lines)
            return extracted_lines
        except ImportError:
            pass

        try:
            import pypdf

            reader = pypdf.PdfReader(file_path)
            extracted_lines = []
            for page_index, page in enumerate(reader.pages):
                text = (page_text_overrides or {}).get(page_index, page.extract_text() or "")
                extracted_lines.extend(line for raw in text.splitlines() if (line := self.clean_text_line(raw)))
            return extracted_lines
        except ImportError:
            raise ImportError(
                "Neither 'pdfplumber' nor 'pypdf' is installed. "
                "Please install at least one via 'pip install pypdf' or 'pip install pdfplumber'."
            )

    def extract_pdf_page_texts(self, source: Any) -> List[str]:
        """Return one layout-aware text string per page, for OCR detection and evidence grounding."""
        try:
            import pdfplumber
            with pdfplumber.open(source) as pdf:
                return ["\n".join(self._pdf_page_lines(page)) for page in pdf.pages]
        except ImportError:
            import pypdf
            reader = pypdf.PdfReader(source)
            return [page.extract_text() or "" for page in reader.pages]

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

        jd_hits = sum(1 for indicator in self.JD_INDICATORS if any(indicator in line for line in norm_lines))
        if jd_hits >= 3 and resume_hits < 2:
            return False
        if resume_hits >= 1:
            return True

        text = "\n".join(lines)
        has_contact = bool(re.search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?\d[\d\s().-]{6,}\d)|linkedin\.com/|github\.com/", text, re.I))
        has_resume_signal = bool(re.search(r"\b(?:20\d{2}|19\d{2})\b|\b(?:bachelor|master|ph\.d|internship|experience|portfolio|github|linkedin)\b", text, re.I))
        return len(text.strip()) >= 80 and (has_contact or has_resume_signal) and jd_hits < 3

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

    def parse(self, file_path: str, page_text_overrides: Optional[Dict[int, str]] = None) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            lines = self._parse_pdf(file_path, page_text_overrides)
        elif ext == ".docx":
            lines = self._parse_docx(file_path)
        else:
            raise ValueError(
                f"Unsupported format: '{ext}'. Only .pdf and .docx are supported."
            )

        return self._build_profile(lines, os.path.basename(file_path), ext)

    def parse_bytes(self, data: bytes, source_filename: str, page_text_overrides: Optional[Dict[int, str]] = None) -> Dict[str, Any]:
        ext = os.path.splitext(source_filename)[1].lower()
        stream = BytesIO(data)
        if ext == ".pdf":
            lines = self._parse_pdf(stream, page_text_overrides)
        elif ext == ".docx":
            lines = self._parse_docx(stream)
        else:
            raise ValueError(f"Unsupported format: '{ext}'. Only .pdf and .docx are supported.")
        return self._build_profile(lines, os.path.basename(source_filename), ext)

    def _build_profile(self, lines: List[str], source_filename: str, ext: str) -> Dict[str, Any]:
        if not self.is_valid_resume(lines):
            raise ValueError(
                f"Document mismatch guardrail triggered: '{source_filename}' "
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
            "source_file": source_filename,
            "cv_file": source_filename,
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
