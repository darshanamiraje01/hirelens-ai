import express from "express";
import {
  getOverview,
  getAtsStats,
  getInterviewPerformance,
  getProgress,
  getSkillGaps,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

//  GET /api/dashboard/overview      → stat cards (resumes, sessions, avg scores)
//  GET /api/dashboard/ats           → ATS score history + skill gap
//  GET /api/dashboard/performance   → interview scores by category over time
//  GET /api/dashboard/progress      → weekly trend + recommended topics
//  GET /api/dashboard/skills        → skill found vs skill gap radar data

router.get("/overview",    getOverview);
router.get("/ats",         getAtsStats);
router.get("/performance", getInterviewPerformance);
router.get("/progress",    getProgress);
router.get("/skills",      getSkillGaps);

export default router;