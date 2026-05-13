import mongoose from "mongoose";

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  COLLECTION: resumeanalyses                                 ║
 * ║  AI-generated analysis of a resume. Kept SEPARATE from      ║
 * ║  Resume so the resume doc stays lean, and a resume can be   ║
 * ║  re-analyzed against different JDs over time.               ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  RELATIONSHIPS:
 *    user          (ObjectId → users)
 *    resume        (ObjectId → resumes)
 *    jobDescription(ObjectId → jobdescriptions)  — null if no JD used
 */
const resumeAnalysisSchema = new mongoose.Schema(
  {
    // ── Foreign keys ───────────────────────────────────────────────────────────
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    resume: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Resume",
      required: true,
      index:    true,
    },
    jobDescription: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "JobDescription",
      default: null,    // null = resume analyzed without a JD
    },

    // ── Scores ─────────────────────────────────────────────────────────────────
    overallScore: { type: Number, min: 0, max: 100, required: true },
    matchScore:   { type: Number, min: 0, max: 100, default: null },  // null = no JD

    // Per-section scores (0–10)
    sectionScores: {
      experience:  { type: Number, default: 0 },
      education:   { type: Number, default: 0 },
      skills:      { type: Number, default: 0 },
      projects:    { type: Number, default: 0 },
      formatting:  { type: Number, default: 0 },
    },

    // ── AI findings ────────────────────────────────────────────────────────────
    strengths:      [String],
    weaknesses:     [String],
    skillsFound:    [String],   // detected in the resume
    skillsGap:      [String],   // in JD but missing from resume
    suggestedRoles: [String],
    improvements:   [String],   // actionable suggestions

    // ── Metadata ───────────────────────────────────────────────────────────────
    modelUsed: { type: String, default: "claude-sonnet-4-20250514" },
  },
  { timestamps: true }
);

export default mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
