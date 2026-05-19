import express from "express";
import {
  startInterview,
  submitAnswer,
  endInterview,
  getMyInterviews,
  getSessionDetail,
} from "../controllers/interviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

//  POST   /api/interview/start               → create session + generate questions
//  GET    /api/interview/sessions            → list all sessions for user
//  GET    /api/interview/session/:sessionId  → single session with Q&A detail
//  POST   /api/interview/answer             → submit + score one answer
//  PATCH  /api/interview/end/:sessionId     → finish session + generate report

router.post  ("/start",              startInterview);
router.get   ("/sessions",           getMyInterviews);
router.get   ("/session/:sessionId", getSessionDetail);
router.post  ("/answer",             submitAnswer);
router.patch ("/end/:sessionId",     endInterview);

export default router;