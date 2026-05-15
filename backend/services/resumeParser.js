// import pdfParse from "pdf-parse";
import mammoth from "mammoth";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// ─── Extract raw text from PDF buffer ────────────────────────────────────────
const extractFromPDF = async (buffer) => {
  const data = await pdfParse(buffer);
  if (!data.text || data.text.trim().length < 50) {
    throw new Error(
      "Could not extract enough text from the PDF. Ensure it is not a scanned image."
    );
  }
  return data.text;
};

// ─── Extract raw text from DOCX buffer ───────────────────────────────────────
const extractFromDOCX = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  if (!result.value || result.value.trim().length < 50) {
    throw new Error("Could not extract enough text from the DOCX file.");
  }
  return result.value;
};

// ─── Main entry: auto-detect format and extract text ─────────────────────────
export const extractTextFromFile = async (buffer, fileType) => {
  try {
    let rawText = "";
    if (fileType === "pdf") {
      rawText = await extractFromPDF(buffer);
    } else if (fileType === "docx" || fileType === "doc") {
      rawText = await extractFromDOCX(buffer);
    } else {
      throw new Error("Unsupported file type for text extraction.");
    }
    // Normalize: collapse multiple spaces/tabs/newlines into single space
    return rawText.replace(/\s+/g, " ").trim();
  } catch (error) {
    throw new Error(`File parsing failed: ${error.message}`);
  }
};

// ─── Parse raw text into structured resume sections ──────────────────────────
// Uses regex-based heading detection — works for most standard resume formats
export const parseResumeIntoSections = (rawText) => {
  const text = rawText;

  // Helper: extract a block of text that follows a heading keyword
  const extractSection = (headingPattern, nextHeadingsPattern) => {
    const regex = new RegExp(
      `(?:${headingPattern})[:\\s]*([\\s\\S]*?)(?=${nextHeadingsPattern}|$)`,
      "i"
    );
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  // All known section headings — used as lookahead to stop extraction
  const allHeadings =
    "experience|education|skills|projects|certifications|summary|objective|achievements|awards|languages|interests|contact";

  const sections = {
    contact:        extractSection("contact|personal info",        allHeadings),
    summary:        extractSection("summary|objective|profile",    allHeadings),
    skills:         extractSection("skills|technical skills",      allHeadings),
    experience:     extractSection("experience|work history",      allHeadings),
    education:      extractSection("education|academic",           allHeadings),
    projects:       extractSection("projects",                     allHeadings),
    certifications: extractSection("certifications|certificates",  allHeadings),
    achievements:   extractSection("achievements|awards",          allHeadings),
  };

  // ── Extract email and phone directly from full text ───────────────────────
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);

  // ── Parse skills section into a clean string array ────────────────────────
  // Handles comma, pipe, bullet, and newline-separated lists
  const skillsList = sections.skills
    ? sections.skills
        .split(/[,|•\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 60)
    : [];

  return {
    email:          emailMatch ? emailMatch[0] : "",
    phone:          phoneMatch ? phoneMatch[0].trim() : "",
    summary:        sections.summary,
    skills:         skillsList,
    experience:     sections.experience,
    education:      sections.education,
    projects:       sections.projects,
    certifications: sections.certifications,
    achievements:   sections.achievements,
  };
};
