import asyncHandler      from "express-async-handler";
import Resume            from "../models/Resume.js";
import InterviewQuestion from "../models/InterviewQuestion.js";
import InterviewResponse from "../models/InterviewResponse.js";
import {
  generateFollowUp,
  scoreConfidence,
  compareResumes,
  simulateRejection,
} from "../services/aiService.js";
import { sendSuccess } from "../utils/apiResponse.js";

// ════════════════════════════════════════════════════════════════════════════════
// FEATURE 1 — FOLLOW-UP QUESTION GENERATION
// @route   POST /api/advanced/followup
// @body    { questionId, sessionId?, role? }
// ════════════════════════════════════════════════════════════════════════════════
export const getFollowUpQuestions = asyncHandler(async (req, res) => {
  const { questionId, sessionId, role = "Software Developer" } = req.body;

  if (!questionId) {
    res.status(400);
    throw new Error("questionId is required");
  }

  const question = await InterviewQuestion.findOne({ _id: questionId, user: req.user._id });
  if (!question) { res.status(404); throw new Error("Question not found"); }

  // Load user's answer for this question if session provided
  let userAnswer = "";
  if (sessionId) {
    const response = await InterviewResponse.findOne({
      question: questionId,
      session:  sessionId,
      user:     req.user._id,
    });
    userAnswer = response?.answerText || "";
  }

  let followUps;
  try {
    followUps = await generateFollowUp(question.questionText, userAnswer, role);
  } catch (err) {
    res.status(502);
    throw new Error(`Follow-up generation failed: ${err.message}`);
  }

  sendSuccess(res, 200, "Follow-up questions generated", {
    originalQuestion: question.questionText,
    yourAnswer:       userAnswer || null,
    followUps,
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// FEATURE 2 — CONFIDENCE SCORING
// @route   POST /api/advanced/confidence
// @body    { answerText, questionId? OR question?, role? }
// ════════════════════════════════════════════════════════════════════════════════
export const getConfidenceScore = asyncHandler(async (req, res) => {
  const { questionId, question: rawQuestion, answerText, role = "Software Developer" } = req.body;

  if (!answerText) { res.status(400); throw new Error("answerText is required"); }

  // Resolve question text from DB or request body
  let questionText = rawQuestion || "";
  if (questionId && !questionText) {
    const q = await InterviewQuestion.findOne({ _id: questionId, user: req.user._id });
    if (q) questionText = q.questionText;
  }
  if (!questionText) {
    res.status(400);
    throw new Error("Provide either questionId (from DB) or question (plain text)");
  }

  let result;
  try {
    result = await scoreConfidence(answerText, questionText, role);
  } catch (err) {
    res.status(502);
    throw new Error(`Confidence scoring failed: ${err.message}`);
  }

  sendSuccess(res, 200, "Confidence score calculated", {
    question: questionText,
    answerText,
    ...result,
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// FEATURE 3 — RESUME VERSION COMPARISON
// @route   POST /api/advanced/compare
// @body    { resumeIdA, resumeIdB }
// ════════════════════════════════════════════════════════════════════════════════
export const compareResumeVersions = asyncHandler(async (req, res) => {
  const { resumeIdA, resumeIdB } = req.body;

  if (!resumeIdA || !resumeIdB) {
    res.status(400);
    throw new Error("Both resumeIdA and resumeIdB are required");
  }
  if (resumeIdA === resumeIdB) {
    res.status(400);
    throw new Error("Provide two different resume IDs to compare");
  }

  const [resumeA, resumeB] = await Promise.all([
    Resume.findOne({ _id: resumeIdA, user: req.user._id }),
    Resume.findOne({ _id: resumeIdB, user: req.user._id }),
  ]);

  if (!resumeA) { res.status(404); throw new Error("Resume A not found"); }
  if (!resumeB) { res.status(404); throw new Error("Resume B not found"); }
  if (!resumeA.rawText || resumeA.rawText.length < 50) {
    res.status(422);
    throw new Error(`Resume A (${resumeA.fileName}) has no extractable text`);
  }
  if (!resumeB.rawText || resumeB.rawText.length < 50) {
    res.status(422);
    throw new Error(`Resume B (${resumeB.fileName}) has no extractable text`);
  }

  let comparison;
  try {
    comparison = await compareResumes(
      resumeA.rawText, resumeB.rawText,
      resumeA.fileName, resumeB.fileName
    );
  } catch (err) {
    res.status(502);
    throw new Error(`Resume comparison failed: ${err.message}`);
  }

  sendSuccess(res, 200, "Resume comparison complete", {
    resumeA: { id: resumeA._id, name: resumeA.fileName, uploadedAt: resumeA.createdAt },
    resumeB: { id: resumeB._id, name: resumeB.fileName, uploadedAt: resumeB.createdAt },
    ...comparison,
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// FEATURE 4 — REJECTION REASON SIMULATION
// @route   POST /api/advanced/rejection
// @body    { resumeId, jobDescription?, role? }
// ════════════════════════════════════════════════════════════════════════════════
export const getRejectionSimulation = asyncHandler(async (req, res) => {
  const { resumeId, jobDescription = "", role = "Software Developer" } = req.body;

  if (!resumeId) { res.status(400); throw new Error("resumeId is required"); }

  const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
  if (!resume)  { res.status(404); throw new Error("Resume not found"); }
  if (!resume.rawText || resume.rawText.length < 50) {
    res.status(422);
    throw new Error("Resume has no extractable text — re-upload the file");
  }

  let result;
  try {
    result = await simulateRejection(resume.rawText, jobDescription, role);
  } catch (err) {
    res.status(502);
    throw new Error(`Rejection simulation failed: ${err.message}`);
  }

  sendSuccess(res, 200, "Rejection simulation complete", {
    resumeName: resume.fileName,
    role,
    ...result,
  });
});