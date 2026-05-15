import express from "express";
import {
  uploadResume,
  getMyResumes,
  getResumeById,
  deleteResume,
  analyzeResume,
} from "../controllers/resumeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// All resume routes require a valid JWT
router.use(protect);

router.get("/",              getMyResumes);                            // GET    /api/resume
router.get("/:id",           getResumeById);                          // GET    /api/resume/:id
router.post("/upload",       upload.single("resume"), uploadResume);  // POST   /api/resume/upload
router.post("/analyze/:id",  analyzeResume);                          // POST   /api/resume/analyze/:id
router.delete("/:id",        deleteResume);                           // DELETE /api/resume/:id

export default router;
