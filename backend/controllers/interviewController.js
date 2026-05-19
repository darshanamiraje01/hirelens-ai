import asyncHandler       from "express-async-handler";
import InterviewSession   from "../models/InterviewSession.js";
import InterviewQuestion  from "../models/InterviewQuestion.js";
import InterviewResponse  from "../models/InterviewResponse.js";
import Feedback           from "../models/Feedback.js";
import Resume             from "../models/Resume.js";
import { generateInterviewQuestions, scoreAnswer, generateSessionFeedback }
  from "../services/aiService.js";
import { sendSuccess }    from "../utils/apiResponse.js";

// ════════════════════════════════════════════════════════════════════════════════
// @route   POST /api/interview/start
// @access  Private
// @desc    Create session + generate all questions via Gemini
// Body: { role, resumeId?, jobDescriptionText?, difficulty?, technical?, behavioral?, hr? }
// ════════════════════════════════════════════════════════════════════════════════
export const startInterview = asyncHandler(async (req, res) => {
  const {
    role,
    resumeId,
    jobDescriptionText = "",
    difficulty         = "medium",
    technical          = 4,
    behavioral         = 3,
    hr                 = 2,
  } = req.body;

  if (!role) {
    res.status(400);
    throw new Error("role is required. E.g. 'Frontend Developer'");
  }

  // ── Fetch resume text if resumeId provided ───────────────────────────────
  let resumeText = "";
  let resumeRef  = null;

  if (resumeId) {
    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) {
      res.status(404);
      throw new Error("Resume not found. Upload a resume first.");
    }
    resumeText = resume.rawText || "";
    resumeRef  = resume._id;
  }

  // ── Create session record ────────────────────────────────────────────────
  const totalQuestions = Number(technical) + Number(behavioral) + Number(hr);
  const session = await InterviewSession.create({
    user:           req.user._id,
    resume:         resumeRef,
    role,
    difficulty,
    type:           "mixed",
    questionConfig: { technical, behavioral, hr },
    totalQuestions,
  });

  // ── Generate questions via Gemini ────────────────────────────────────────
  let rawQuestions;
  try {
    rawQuestions = await generateInterviewQuestions(
      resumeText,
      jobDescriptionText,
      role,
      { technical, behavioral, hr, difficulty }
    );
  } catch (err) {
    // Clean up the session if AI fails
    await InterviewSession.findByIdAndDelete(session._id);
    res.status(502);
    throw new Error(`Question generation failed: ${err.message}`);
  }

  // ── Save questions to DB ─────────────────────────────────────────────────
  const questionDocs = await InterviewQuestion.insertMany(
    rawQuestions.map((q) => ({
      session:      session._id,
      user:         req.user._id,
      resume:       resumeRef,
      questionText: q.questionText,
      category:     q.category,
      type:         q.type,
      difficulty:   q.difficulty || difficulty,
      hint:         q.hint         || "",
      followUp:     q.followUp     || "",
      order:        q.order,
    }))
  );

  sendSuccess(res, 201, "Interview session started", {
    sessionId:      session._id,
    role:           session.role,
    difficulty:     session.difficulty,
    totalQuestions: session.totalQuestions,
    questionConfig: session.questionConfig,
    questions:      questionDocs.map((q) => ({
      questionId:   q._id,
      order:        q.order,
      questionText: q.questionText,
      category:     q.category,
      type:         q.type,
      difficulty:   q.difficulty,
      hint:         q.hint,
      followUp:     q.followUp,
    })),
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// @route   POST /api/interview/answer
// @access  Private
// @desc    Submit an answer → AI scores it → saves InterviewResponse
// Body: { sessionId, questionId, answerText, timeTakenSecs? }
// ════════════════════════════════════════════════════════════════════════════════
export const submitAnswer = asyncHandler(async (req, res) => {
  const { sessionId, questionId, answerText = "", timeTakenSecs = 0 } = req.body;

  if (!sessionId || !questionId) {
    res.status(400);
    throw new Error("sessionId and questionId are required");
  }

  // ── Validate session belongs to user ────────────────────────────────────
  const session = await InterviewSession.findOne({
    _id:    sessionId,
    user:   req.user._id,
    status: "in_progress",
  });
  if (!session) {
    res.status(404);
    throw new Error("Active session not found");
  }

  // ── Validate question belongs to session ─────────────────────────────────
  const question = await InterviewQuestion.findOne({
    _id:     questionId,
    session: sessionId,
  });
  if (!question) {
    res.status(404);
    throw new Error("Question not found in this session");
  }

  // ── Check not already answered ───────────────────────────────────────────
  const existing = await InterviewResponse.findOne({ session: sessionId, question: questionId });
  if (existing) {
    res.status(409);
    throw new Error("This question has already been answered");
  }

  // ── Score with Gemini ────────────────────────────────────────────────────
  let aiScore;
  try {
    aiScore = await scoreAnswer(question.questionText, answerText, session.role);
  } catch (err) {
    res.status(502);
    throw new Error(`AI scoring failed: ${err.message}`);
  }

  // ── Save response ────────────────────────────────────────────────────────
  const response = await InterviewResponse.create({
    session:       sessionId,
    question:      questionId,
    user:          req.user._id,
    answerText,
    timeTakenSecs,
    score:         aiScore.score,
    feedback:      aiScore.feedback,
    missedPoints:  aiScore.missedPoints || [],
    betterAnswer:  aiScore.betterAnswer || "",
    isScored:      true,
    isSkipped:     !answerText,
  });

  // Mark question as answered
  await InterviewQuestion.findByIdAndUpdate(questionId, { isAnswered: true });

  sendSuccess(res, 200, "Answer submitted and scored", {
    responseId:   response._id,
    score:        aiScore.score,
    feedback:     aiScore.feedback,
    missedPoints: aiScore.missedPoints,
    betterAnswer: aiScore.betterAnswer,
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// @route   PATCH /api/interview/end/:sessionId
// @access  Private
// @desc    End session → calculate total score → generate final feedback report
// ════════════════════════════════════════════════════════════════════════════════
export const endInterview = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id:  req.params.sessionId,
    user: req.user._id,
  });
  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  // ── Gather all responses for this session ────────────────────────────────
  const responses = await InterviewResponse.find({ session: session._id })
    .populate("question", "questionText category");

  if (responses.length === 0) {
    res.status(400);
    throw new Error("No answers submitted. Answer at least one question before ending.");
  }

  // ── Calculate average score ──────────────────────────────────────────────
  const avgScore = Math.round(
    responses.reduce((sum, r) => sum + r.score, 0) / responses.length * 10
  ); // scale 0-10 → 0-100

  // ── Generate AI feedback report ──────────────────────────────────────────
  let aiFeedback;
  try {
    aiFeedback = await generateSessionFeedback(
      responses.map((r) => ({
        questionText: r.question?.questionText || "",
        category:     r.question?.category    || "general",
        answerText:   r.answerText,
        score:        r.score,
      })),
      session.role
    );
  } catch (err) {
    res.status(502);
    throw new Error(`Feedback generation failed: ${err.message}`);
  }

  // ── Save feedback document ───────────────────────────────────────────────
  const feedback = await Feedback.create({
    user:               req.user._id,
    session:            session._id,
    overallScore:       aiFeedback.overallScore       || avgScore,
    communicationScore: aiFeedback.communicationScore || 0,
    technicalScore:     aiFeedback.technicalScore     || 0,
    confidenceScore:    aiFeedback.confidenceScore    || 0,
    summary:            aiFeedback.summary            || "",
    topStrengths:       aiFeedback.topStrengths       || [],
    areasToImprove:     aiFeedback.areasToImprove     || [],
    recommendedTopics:  aiFeedback.recommendedTopics  || [],
    readyForInterview:  aiFeedback.readyForInterview  || false,
  });

  // ── Update session status ────────────────────────────────────────────────
  await InterviewSession.findByIdAndUpdate(session._id, {
    status:      "completed",
    totalScore:  aiFeedback.overallScore || avgScore,
    completedAt: new Date(),
  });

  sendSuccess(res, 200, "Interview completed! Here is your feedback report.", {
    sessionId:          session._id,
    role:               session.role,
    totalQuestionsAsked: responses.length,
    overallScore:       feedback.overallScore,
    communicationScore: feedback.communicationScore,
    technicalScore:     feedback.technicalScore,
    confidenceScore:    feedback.confidenceScore,
    summary:            feedback.summary,
    topStrengths:       feedback.topStrengths,
    areasToImprove:     feedback.areasToImprove,
    recommendedTopics:  feedback.recommendedTopics,
    readyForInterview:  feedback.readyForInterview,
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// @route   GET /api/interview/sessions
// @access  Private
// @desc    Get all sessions for the logged-in user
// ════════════════════════════════════════════════════════════════════════════════
export const getMyInterviews = asyncHandler(async (req, res) => {
  const sessions = await InterviewSession.find({ user: req.user._id })
    .populate("resume", "fileName fileType")
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, "Sessions fetched", {
    count: sessions.length,
    sessions,
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// @route   GET /api/interview/session/:sessionId
// @access  Private
// @desc    Get one session with all questions and responses
// ════════════════════════════════════════════════════════════════════════════════
export const getSessionDetail = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id:  req.params.sessionId,
    user: req.user._id,
  }).populate("resume", "fileName");

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  const questions = await InterviewQuestion.find({ session: session._id }).sort("order");
  const responses = await InterviewResponse.find({ session: session._id });
  const feedback  = await Feedback.findOne({ session: session._id });

  // Merge questions with their responses
  const questionsWithAnswers = questions.map((q) => {
    const resp = responses.find((r) => r.question.toString() === q._id.toString());
    return {
      order:        q.order,
      questionText: q.questionText,
      category:     q.category,
      type:         q.type,
      hint:         q.hint,
      answer:       resp?.answerText   || null,
      score:        resp?.score        || null,
      feedback:     resp?.feedback     || null,
      betterAnswer: resp?.betterAnswer || null,
      isSkipped:    resp?.isSkipped    || false,
    };
  });

  sendSuccess(res, 200, "Session detail fetched", {
    session,
    questionsWithAnswers,
    feedback: feedback || null,
  });
});
