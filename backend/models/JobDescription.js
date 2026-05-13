import mongoose from "mongoose";

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  COLLECTION: jobdescriptions                                ║
 * ║  User pastes a JD they are targeting. Used for:            ║
 * ║    • Resume match scoring                                   ║
 * ║    • Targeted interview question generation                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  RELATIONSHIPS:
 *    user          (ObjectId → users)
 *    linkedResumes ([ObjectId] → resumes)  — resumes matched vs this JD
 */
const jobDescriptionSchema = new mongoose.Schema(
  {
    // ── Foreign keys ───────────────────────────────────────────────────────────
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    linkedResumes: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Resume" }
    ],

    // ── JD content ─────────────────────────────────────────────────────────────
    jobTitle:   { type: String, required: [true, "Job title is required"], trim: true },
    company:    { type: String, default: "",   trim: true },
    location:   { type: String, default: "" },
    rawText:    { type: String, required: [true, "JD text is required"] },

    // ── AI-extracted fields (populated in Phase 3) ─────────────────────────────
    requiredSkills:  [String],    // ["React", "TypeScript"]
    preferredSkills: [String],    // ["GraphQL", "AWS"]
    experienceLevel: {
      type:    String,
      enum:    ["entry", "mid", "senior", "lead", "any"],
      default: "any",
    },
  },
  { timestamps: true }
);

export default mongoose.model("JobDescription", jobDescriptionSchema);
