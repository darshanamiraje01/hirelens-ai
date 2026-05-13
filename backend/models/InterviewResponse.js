import mongoose from "mongoose";

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  COLLECTION: interviewresponses                             ║
 * ║  One document = user's answer + AI score for one question.  ║
 * ║  1:1 with InterviewQuestion within the same session.        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  RELATIONSHIPS:
 *    session  (ObjectId → interviewsessions)
 *    question (ObjectId → interviewquestions)
 *    user     (ObjectId → users)
 */
const interviewResponseSchema = new mongoose.Schema(
  {
    // ── Foreign keys ───────────────────────────────────────────────────────────
    session: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "InterviewSession",
      required: true,
      index:    true,
    },
    question: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "InterviewQuestion",
      required: true,
    },
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    // ── User's answer ──────────────────────────────────────────────────────────
    answerText:    { type: String, default: "" },
    timeTakenSecs: { type: Number, default: 0 },     // how long user took

    // ── AI scoring (populated after user submits answer) ───────────────────────
    score:        { type: Number, min: 0, max: 10, default: 0 },
    feedback:     { type: String, default: "" },      // 2-3 sentence feedback
    missedPoints: [String],                            // key points not mentioned
    betterAnswer: { type: String, default: "" },      // AI improved version

    // ── Status ─────────────────────────────────────────────────────────────────
    isScored:  { type: Boolean, default: false },     // true after AI scores it
    isSkipped: { type: Boolean, default: false },     // true if user skipped
  },
  { timestamps: true }
);

export default mongoose.model("InterviewResponse", interviewResponseSchema);
