import express from "express";
import {
  evaluateSingleAnswer,
  evaluateFullSession,
} from "../controllers/evaluationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// POST /api/evaluate/answer              — evaluate one answer deeply
// POST /api/evaluate/session/:sessionId  — evaluate all answers in a session
router.post("/answer",                evaluateSingleAnswer);
router.post("/session/:sessionId",    evaluateFullSession);

export default router;