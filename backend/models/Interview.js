import mongoose from "mongoose";

// Each Q&A pair within a session
const questionSchema = new mongoose.Schema({
  question:       { type: String, required: true },
  userAnswer:     { type: String, default: "" },
  idealAnswer:    { type: String, default: "" },
  score:          { type: Number, default: 0 },    // 0–10
  feedback:       { type: String, default: "" },
  timeTaken:      { type: Number, default: 0 },    // seconds
});

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    role: {
      type: String,        // e.g. "Frontend Developer"
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    questions:  [questionSchema],
    totalScore: { type: Number, default: 0 },     // Average across all Qs
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-calculate totalScore before saving
interviewSchema.pre("save", function (next) {
  if (this.questions.length > 0) {
    const total = this.questions.reduce((sum, q) => sum + q.score, 0);
    this.totalScore = parseFloat((total / this.questions.length).toFixed(2));
  }
  next();
});

const Interview = mongoose.model("Interview", interviewSchema);
export default Interview;
