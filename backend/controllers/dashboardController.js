import asyncHandler      from "express-async-handler";
import User              from "../models/User.js";
import Resume            from "../models/Resume.js";
import ResumeAnalysis    from "../models/ResumeAnalysis.js";
import InterviewSession  from "../models/InterviewSession.js";
import InterviewResponse from "../models/InterviewResponse.js";
import InterviewQuestion from "../models/InterviewQuestion.js";
import Feedback          from "../models/Feedback.js";
import { sendSuccess }   from "../utils/apiResponse.js";

// ════════════════════════════════════════════════════════════════════════════════
// @route   GET /api/dashboard/overview
// @access  Private
// @desc    Top-level stats card — the first thing the user sees on the dashboard
// ════════════════════════════════════════════════════════════════════════════════
export const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Run all count queries in parallel — much faster than sequential awaits
  const [
    totalResumes,
    analyzedResumes,
    totalSessions,
    completedSessions,
    latestAnalysis,
    latestFeedback,
  ] = await Promise.all([
    Resume.countDocuments({ user: userId }),
    Resume.countDocuments({ user: userId, isAnalyzed: true }),
    InterviewSession.countDocuments({ user: userId }),
    InterviewSession.countDocuments({ user: userId, status: "completed" }),
    ResumeAnalysis.findOne({ user: userId }).sort({ createdAt: -1 }),
    Feedback.findOne({ user: userId }).sort({ createdAt: -1 }),
  ]);

  // Average ATS score across all analyses
  const atsAgg = await ResumeAnalysis.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, avg: { $avg: "$overallScore" } } },
  ]);
  const avgAtsScore = atsAgg[0] ? Math.round(atsAgg[0].avg) : 0;

  // Average interview score across completed sessions
  const sessionAgg = await InterviewSession.aggregate([
    { $match: { user: userId, status: "completed" } },
    { $group: { _id: null, avg: { $avg: "$totalScore" } } },
  ]);
  const avgInterviewScore = sessionAgg[0] ? Math.round(sessionAgg[0].avg) : 0;

  sendSuccess(res, 200, "Dashboard overview", {
    resumes: {
      total:    totalResumes,
      analyzed: analyzedResumes,
      pending:  totalResumes - analyzedResumes,
    },
    interviews: {
      total:     totalSessions,
      completed: completedSessions,
      abandoned: totalSessions - completedSessions,
    },
    scores: {
      avgAtsScore,
      avgInterviewScore,
      latestAtsScore:       latestAnalysis?.overallScore     ?? null,
      latestInterviewScore: latestFeedback?.overallScore     ?? null,
      readyForInterview:    latestFeedback?.readyForInterview ?? false,
    },
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// @route   GET /api/dashboard/ats
// @access  Private
// @desc    ATS score history + skill gap analysis across all resume analyses
// ════════════════════════════════════════════════════════════════════════════════
export const getAtsStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const analyses = await ResumeAnalysis.find({ user: userId })
    .populate("resume", "fileName fileType createdAt")
    .sort({ createdAt: -1 })
    .limit(10);

  if (!analyses.length) {
    return sendSuccess(res, 200, "No resume analyses yet", {
      scoreHistory: [],
      skillsFound:  [],
      skillsGap:    [],
      topWeaknesses:[],
    });
  }

  // Build score history for chart
  const scoreHistory = analyses.map((a) => ({
    analysisId:  a._id,
    resumeName:  a.resume?.fileName || "Resume",
    atsScore:    a.overallScore,
    matchScore:  a.matchScore,
    date:        a.createdAt,
    scoreBreakdown: a.sectionScores,
  }));

  // Aggregate all skills found and gaps across analyses
  const allSkillsFound = [...new Set(analyses.flatMap((a) => a.skillsFound || []))];
  const allSkillsGap   = [...new Set(analyses.flatMap((a) => a.skillsGap   || []))];
  const allWeaknesses  = [...new Set(analyses.flatMap((a) => a.weaknesses  || []))];

  // Most recent analysis full detail
  const latest = analyses[0];

  sendSuccess(res, 200, "ATS statistics", {
    latestScore:   latest.overallScore,
    latestMatchScore: latest.matchScore,
    scoreHistory,
    skillsFound:   allSkillsFound,
    skillsGap:     allSkillsGap,
    topWeaknesses: allWeaknesses.slice(0, 5),
    improvements:  latest.improvements || [],
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// @route   GET /api/dashboard/performance
// @access  Private
// @desc    Interview performance breakdown — scores by category over time
// ════════════════════════════════════════════════════════════════════════════════
export const getInterviewPerformance = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const sessions = await InterviewSession.find({
    user:   userId,
    status: "completed",
  })
    .populate("resume", "fileName")
    .sort({ completedAt: -1 })
    .limit(10);

  if (!sessions.length) {
    return sendSuccess(res, 200, "No completed interviews yet", {
      sessionHistory: [],
      categoryBreakdown: {},
      avgScores: {},
    });
  }

  const sessionIds = sessions.map((s) => s._id);

  // Fetch all feedbacks for completed sessions
  const feedbacks = await Feedback.find({
    session: { $in: sessionIds },
    user: userId,
  });

  // Fetch all responses to compute category-level performance
  const responses = await InterviewResponse.find({
    session: { $in: sessionIds },
    user: userId,
    isScored: true,
  }).populate("question", "category type");

  // Group response scores by category
  const byCategory = { technical: [], behavioral: [], hr: [] };
  responses.forEach((r) => {
    const cat = r.question?.category;
    if (cat && byCategory[cat]) byCategory[cat].push(r.score);
  });

  const avgByCategory = {};
  Object.entries(byCategory).forEach(([cat, scores]) => {
    avgByCategory[cat] = scores.length
      ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
      : 0;
  });

  // Build per-session history for progress chart
  const sessionHistory = sessions.map((s) => {
    const fb = feedbacks.find(
      (f) => f.session.toString() === s._id.toString()
    );
    return {
      sessionId:          s._id,
      role:               s.role,
      difficulty:         s.difficulty,
      date:               s.completedAt,
      overallScore:       fb?.overallScore       ?? s.totalScore,
      communicationScore: fb?.communicationScore ?? 0,
      technicalScore:     fb?.technicalScore     ?? 0,
      confidenceScore:    fb?.confidenceScore    ?? 0,
      readyForInterview:  fb?.readyForInterview  ?? false,
      durationSecs:       s.durationSecs,
    };
  });

  // Overall averages
  const safeAvg = (arr) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const avgScores = {
    overall:       safeAvg(sessionHistory.map((s) => s.overallScore)),
    communication: safeAvg(feedbacks.map((f) => f.communicationScore)),
    technical:     safeAvg(feedbacks.map((f) => f.technicalScore)),
    confidence:    safeAvg(feedbacks.map((f) => f.confidenceScore)),
  };

  sendSuccess(res, 200, "Interview performance", {
    totalCompleted: sessions.length,
    avgScores,
    categoryBreakdown: avgByCategory,
    sessionHistory,
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// @route   GET /api/dashboard/progress
// @access  Private
// @desc    Progress tracking — week-by-week score trend + recommended topics
// ════════════════════════════════════════════════════════════════════════════════
export const getProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Last 30 days of completed sessions
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSessions = await InterviewSession.find({
    user:        userId,
    status:      "completed",
    completedAt: { $gte: thirtyDaysAgo },
  }).sort({ completedAt: 1 });

  const recentFeedbacks = await Feedback.find({
    user:      userId,
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Group sessions by week number for the trend chart
  const weeklyData = {};
  recentSessions.forEach((s) => {
    const fb = recentFeedbacks.find(
      (f) => f.session.toString() === s._id.toString()
    );
    const weekStart = new Date(s.completedAt);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = weekStart.toISOString().slice(0, 10); // "2025-06-09"
    if (!weeklyData[key]) weeklyData[key] = { scores: [], count: 0 };
    weeklyData[key].scores.push(fb?.overallScore ?? s.totalScore);
    weeklyData[key].count++;
  });

  const weeklyTrend = Object.entries(weeklyData).map(([week, data]) => ({
    week,
    sessionsCompleted: data.count,
    avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
  }));

  // Collect all recommended topics from feedbacks
  const allTopics = recentFeedbacks.flatMap((f) => f.recommendedTopics || []);
  const topicFreq = allTopics.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const recommendedTopics = Object.entries(topicFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, count]) => ({ topic, frequency: count }));

  // Simple improvement score: compare first half vs second half of sessions
  let improvementScore = null;
  if (recentSessions.length >= 4) {
    const half     = Math.floor(recentSessions.length / 2);
    const firstIds = recentSessions.slice(0, half).map((s) => s._id.toString());
    const lastIds  = recentSessions.slice(half).map((s) => s._id.toString());
    const firstFbs = recentFeedbacks.filter((f) => firstIds.includes(f.session.toString()));
    const lastFbs  = recentFeedbacks.filter((f) => lastIds.includes(f.session.toString()));
    const firstAvg = firstFbs.length ? firstFbs.reduce((a, f) => a + f.overallScore, 0) / firstFbs.length : 0;
    const lastAvg  = lastFbs.length  ? lastFbs.reduce((a, f) => a + f.overallScore,  0) / lastFbs.length  : 0;
    improvementScore = Math.round(lastAvg - firstAvg); // positive = improving
  }

  sendSuccess(res, 200, "Progress tracking", {
    period:          "last 30 days",
    sessionsInPeriod: recentSessions.length,
    weeklyTrend,
    recommendedTopics,
    improvementScore,  // null if < 4 sessions, else delta (+/-)
    message:
      improvementScore === null
        ? "Complete at least 4 sessions to see your improvement trend."
        : improvementScore > 0
        ? `You improved by ${improvementScore} points over the last 30 days. Keep it up!`
        : improvementScore === 0
        ? "Your score is stable. Try harder questions to push further."
        : `Score dipped by ${Math.abs(improvementScore)} points. Review recommended topics.`,
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// @route   GET /api/dashboard/skills
// @access  Private
// @desc    Skill gap radar — what you have vs what roles demand
// ════════════════════════════════════════════════════════════════════════════════
export const getSkillGaps = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const analyses = await ResumeAnalysis.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5);

  if (!analyses.length) {
    return sendSuccess(res, 200, "No skill data yet — analyze a resume first", {
      skillsFound: [],
      skillsGap:   [],
      suggestions: [],
    });
  }

  // Deduplicate and count frequency of each skill found/missing
  const foundFreq = {};
  const gapFreq   = {};

  analyses.forEach((a) => {
    (a.skillsFound || []).forEach((s) => { foundFreq[s] = (foundFreq[s] || 0) + 1; });
    (a.skillsGap   || []).forEach((s) => { gapFreq[s]   = (gapFreq[s]   || 0) + 1; });
  });

  const skillsFound = Object.entries(foundFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([skill, count]) => ({ skill, frequency: count }));

  const skillsGap = Object.entries(gapFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([skill, count]) => ({ skill, frequency: count }));

  // All improvement suggestions from analyses
  const suggestions = [
    ...new Set(analyses.flatMap((a) => a.improvements || [])),
  ].slice(0, 6);

  sendSuccess(res, 200, "Skill gap analysis", {
    skillsFound,
    skillsGap,
    topMissingSkills: skillsGap.slice(0, 5).map((s) => s.skill),
    suggestions,
  });
});