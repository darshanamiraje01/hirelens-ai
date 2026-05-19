import express from "express";
import { generateFeedback, getFeedback } from "../controllers/feedbackController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/:interviewId",      getFeedback);
router.post("/generate/:interviewId", generateFeedback);

export default router;
