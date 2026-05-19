import asyncHandler      from "express-async-handler";
import InterviewQuestion from "../models/InterviewQuestion.js";
import InterviewResponse from "../models/InterviewResponse.js";
import InterviewSession  from "../models/InterviewSession.js";
import { evaluateAnswer } from "../services/aiService.js";
import { sendSuccess }   from "../utils/apiResponse.js";

// ════════════════════════════════════════════════════════════════════════════════
// @route   POST /api/evaluate/answer
// @access  Private
// @desc    Deep evaluation of a single answer — 6 dimension scores + improved answer
// Body:    { questionId, answerText, sessionId? }
// ════════════════════════════════════════════════════════════════════════════════
export const evaluateSingleAnswer = asyncHandler(async (req, res) => {
  const { questionId, answerText = "", sessionId } = req.body;

  if (!questionId) {
    res.status(400);
    throw new Error("questionId is required");
  }

  // ── Load question ────────────────────────────────────────────────────────────
  const question = await InterviewQuestion.findOne({
    _id:  questionId,
    user: req.user._id,
  });
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  // ── Load session for role context (optional) ─────────────────────────────────
  let role     = "Software Developer";
  let category = question.category || "technical";

  if (sessionId) {
    const session = await InterviewSession.findOne({
      _id:  sessionId,
      user: req.user._id,
    });
    if (session) role = session.role;
  }

  // ── Call Gemini for deep evaluation ──────────────────────────────────────────
  let evaluation;
  try {
    evaluation = await evaluateAnswer(question.questionText, answerText, role, category);
  } catch (err) {
    res.status(502);
    throw new Error(`Evaluation failed: ${err.message}`);
  }

  // ── Persist scores back onto the InterviewResponse (if it exists) ─────────────
  if (sessionId) {
    await InterviewResponse.findOneAndUpdate(
      { question: questionId, session: sessionId, user: req.user._id },
      {
        score:        evaluation.scores.overall,
        feedback:     evaluation.overallFeedback,
        missedPoints: evaluation.missedConcepts,
        betterAnswer: evaluation.improvedAnswer,
        isScored:     true,
      },
      { new: true }
    );
  }

  sendSuccess(res, 200, "Answer evaluated", {
    question:       question.questionText,
    category:       question.category,
    yourAnswer:     answerText || "(no answer)",
    scores:         evaluation.scores,
    feedback:       evaluation.feedback,
    overallFeedback:evaluation.overallFeedback,
    grade:          evaluation.grade,
    missedConcepts: evaluation.missedConcepts,
    improvedAnswer: evaluation.improvedAnswer,
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// @route   POST /api/evaluate/session/:sessionId
// @access  Private
// @desc    Re-evaluate ALL responses in a session — returns per-question breakdown
// ════════════════════════════════════════════════════════════════════════════════
export const evaluateFullSession = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id:  req.params.sessionId,
    user: req.user._id,
  });
  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  const responses = await InterviewResponse.find({
    session: req.params.sessionId,
  }).populate("question");

  if (!responses.length) {
    res.status(400);
    throw new Error("No responses found for this session");
  }

  // ── Evaluate each response sequentially (avoid parallel quota hammering) ──────
  const results = [];
  for (const resp of responses) {
    const q = resp.question;
    if (!q) continue;

    let evaluation;
    try {
      evaluation = await evaluateAnswer(
        q.questionText,
        resp.answerText,
        session.role,
        q.category
      );
    } catch (err) {
      // Don't abort full session eval if one question fails
      evaluation = {
        scores: { relevance: 0, clarity: 0, technicalAccuracy: 0, depth: 0, confidence: 0, overall: 0 },
        feedback: {},
        overallFeedback: `Evaluation failed: ${err.message}`,
        grade: "F",
        missedConcepts: [],
        improvedAnswer: "",
      };
    }

    // Save updated score back to response
    await InterviewResponse.findByIdAndUpdate(resp._id, {
      score:        evaluation.scores.overall,
      feedback:     evaluation.overallFeedback,
      missedPoints: evaluation.missedConcepts,
      betterAnswer: evaluation.improvedAnswer,
      isScored:     true,
    });

    results.push({
      order:          q.order,
      questionText:   q.questionText,
      category:       q.category,
      yourAnswer:     resp.answerText || "(skipped)",
      scores:         evaluation.scores,
      feedback:       evaluation.feedback,
      overallFeedback:evaluation.overallFeedback,
      grade:          evaluation.grade,
      missedConcepts: evaluation.missedConcepts,
      improvedAnswer: evaluation.improvedAnswer,
    });
  }

  // ── Compute aggregate scores across all questions ─────────────────────────────
  const avg = (field) =>
    Math.round(results.reduce((s, r) => s + (r.scores[field] || 0), 0) / results.length);

  const summary = {
    totalQuestions:      results.length,
    averageOverall:      avg("overall"),
    averageRelevance:    avg("relevance"),
    averageClarity:      avg("clarity"),
    averageTechnical:    avg("technicalAccuracy"),
    averageDepth:        avg("depth"),
    averageConfidence:   avg("confidence"),
    gradeDistribution:   results.reduce((acc, r) => {
      acc[r.grade] = (acc[r.grade] || 0) + 1;
      return acc;
    }, {}),
  };

  sendSuccess(res, 200, "Full session evaluated", {
    sessionId:  session._id,
    role:       session.role,
    summary,
    breakdown:  results,
  });
});