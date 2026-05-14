import mongoose from "mongoose";

// ─── Parsed sections sub-schema ───────────────────────────────────────────────
// Populated by resumeParser.parseResumeIntoSections()
const parsedSectionsSchema = new mongoose.Schema(
  {
    email:          { type: String, default: "" },
    phone:          { type: String, default: "" },
    summary:        { type: String, default: "" },
    skills:         [String],
    experience:     { type: String, default: "" },
    education:      { type: String, default: "" },
    projects:       { type: String, default: "" },
    certifications: { type: String, default: "" },
    achievements:   { type: String, default: "" },
  },
  { _id: false }  // No separate _id for sub-document
);

// ─── AI analysis sub-schema ───────────────────────────────────────────────────
// Populated after Claude analyzes the resume (Phase 3)
const analysisSchema = new mongoose.Schema(
  {
    overallScore:   { type: Number, default: 0 },   // 0–100
    strengths:      [String],
    weaknesses:     [String],
    skillsFound:    [String],
    suggestedRoles: [String],
    improvements:   [String],
  },
  { _id: false }
);

// ─── Main Resume schema ───────────────────────────────────────────────────────
const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true,
      index: true,  // Fast lookup by user
    },

    // ── File metadata ───────────────────────────────────────────────────────
    fileName:     { type: String, required: true },
    fileType:     { type: String, enum: ["pdf", "docx", "doc"], required: true },
    fileSize:     { type: Number, required: true },        // bytes
    fileUrl:      { type: String, required: true },        // Cloudinary URL
    cloudinaryId: { type: String, required: true },        // For deletion

    // ── Extracted content ───────────────────────────────────────────────────
    rawText:        { type: String, default: "" },         // Full plain text
    parsedSections: { type: parsedSectionsSchema, default: () => ({}) },

    // ── AI analysis (populated in Phase 3) ─────────────────────────────────
    analysis:     { type: analysisSchema, default: () => ({}) },

    // ── JD matching (optional, populated when user provides a job description)
    jobDescription: { type: String, default: "" },
    matchScore:     { type: Number, default: null },       // 0–100 or null

    // ── Status flag ─────────────────────────────────────────────────────────
    isAnalyzed:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;
