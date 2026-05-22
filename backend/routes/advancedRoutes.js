import express from "express";
import {
  getFollowUpQuestions,
  getConfidenceScore,
  compareResumeVersions,
  getRejectionSimulation,
} from "../controllers/advancedController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// POST /api/advanced/followup    → generate 3 follow-up questions for an answer
// POST /api/advanced/confidence  → score confidence/communication of an answer
// POST /api/advanced/compare     → compare two resume versions side-by-side
// POST /api/advanced/rejection   → simulate why a resume gets rejected

router.post("/followup",   getFollowUpQuestions);
router.post("/confidence", getConfidenceScore);
router.post("/compare",    compareResumeVersions);
router.post("/rejection",  getRejectionSimulation);

export default router;