import mongoose from "mongoose";

/**
 * COLLECTION: interviewquestions
 *
 * One document = one AI-generated question in a session.
 * Stored separately so questions can be fetched one at a time
 * and independently referenced for analytics.
 *
 * RELATIONSHIPS:
 *   session (ObjectId → interviewsessions)
 *   user    (ObjectId → users)  — denormalized for fast user-level queries
 *   resume  (ObjectId → resumes) — which resume was used to generate this
 */
const interviewQuestionSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },

    // ── Question content ────────────────────────────────────────────────────
    questionText: {
      type: String,
      required: [true, "Question text is required"],
    },
    category: {
      type: String,
      enum: ["technical", "behavioral", "hr"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "coding", "system_design", "domain",         // technical subtypes
        "leadership", "teamwork", "conflict",         // behavioral subtypes
        "motivation", "culture_fit", "salary", "career_goals", // hr subtypes
      ],
      default: "domain",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    hint:        { type: String, default: "" },  // what strong answer covers
    followUp:    { type: String, default: "" },  // natural follow-up question
    idealAnswer: { type: String, default: "" },  // filled after user answers

    // ── Position in the session ──────────────────────────────────────────────
    order: { type: Number, required: true },      // 1, 2, 3 ...

    // ── Status ───────────────────────────────────────────────────────────────
    isAnswered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("InterviewQuestion", interviewQuestionSchema);
