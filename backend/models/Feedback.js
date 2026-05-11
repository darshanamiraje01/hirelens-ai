import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
    },
    overallScore:       { type: Number, required: true },
    communicationScore: { type: Number, default: 0 },
    technicalScore:     { type: Number, default: 0 },
    confidenceScore:    { type: Number, default: 0 },
    summary:            { type: String, default: "" },  // AI-generated overall summary
    topStrengths:       [String],
    areasToImprove:     [String],
    recommendedTopics:  [String],                       // Topics to study next
    readyForInterview:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
