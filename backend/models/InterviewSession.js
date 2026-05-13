import mongoose from "mongoose";

/**
 * COLLECTION: interviewsessions
 *
 * Parent document for one complete mock interview sitting.
 * Questions, Responses and Feedback are in SEPARATE collections.
 *
 * RELATIONSHIPS:
 *   user           (ObjectId → users)
 *   resume         (ObjectId → resumes)
 *   jobDescription (ObjectId → jobdescriptions)
 */
const interviewSessionSchema = new mongoose.Schema(
  {
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
    jobDescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDescription",
      default: null,
    },

    // ── Session config ───────────────────────────────────────────────────────
    role:       { type: String, required: [true, "Role is required"], trim: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    type:       { type: String, enum: ["technical", "behavioral", "mixed"], default: "mixed" },

    // Question count breakdown
    questionConfig: {
      technical:  { type: Number, default: 4 },
      behavioral: { type: Number, default: 3 },
      hr:         { type: Number, default: 2 },
    },
    totalQuestions: { type: Number, default: 9 },

    // ── Session outcome ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    totalScore:   { type: Number, default: 0 },
    durationSecs: { type: Number, default: 0 },
    completedAt:  { type: Date,   default: null },
  },
  { timestamps: true }
);

interviewSessionSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

export default mongoose.model("InterviewSession", interviewSessionSchema);
