import asyncHandler from "express-async-handler";
import cloudinary, { uploadBufferToCloudinary } from "../config/cloudinary.js";
import Resume         from "../models/Resume.js";
import ResumeAnalysis from "../models/ResumeAnalysis.js";
import { getFileType } from "../middleware/uploadMiddleware.js";
import { extractTextFromFile, parseResumeIntoSections } from "../services/resumeParser.js";
import { analyzeResume as analyzeResumeAI } from "../services/aiService.js";
import { sendSuccess } from "../utils/apiResponse.js";

// ─── @route   POST /api/resume/upload ─────────────────────────────────────────
// ─── @access  Private
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file received. In Postman → Body → form-data → Key='resume', Type=File.");
  }

  const { buffer, originalname, mimetype, size } = req.file;
  const fileType = getFileType(mimetype);

  // Step 1: Upload to Cloudinary
  let cloudinaryResult;
  try {
    const folder       = `hirelens/resumes/${req.user._id}`;
    const safeFilename = `${Date.now()}-${originalname.replace(/\s+/g, "_")}`;
    cloudinaryResult   = await uploadBufferToCloudinary(buffer, folder, safeFilename);
  } catch (err) {
    res.status(502);
    throw new Error(`Cloudinary upload failed: ${err.message}`);
  }

  // Step 2: Extract text
  let rawText;
  try {
    rawText = await extractTextFromFile(buffer, fileType);
  } catch (err) {
    await cloudinary.uploader
      .destroy(cloudinaryResult.public_id, { resource_type: "raw" })
      .catch(() => {});
    res.status(422);
    throw new Error(`Text extraction failed: ${err.message}`);
  }

  // Step 3: Parse sections
  const parsedSections = parseResumeIntoSections(rawText);

  // Step 4: Save to MongoDB
  const resume = await Resume.create({
    user:           req.user._id,
    fileName:       originalname,
    fileType,
    fileSize:       size,
    fileUrl:        cloudinaryResult.secure_url,
    cloudinaryId:   cloudinaryResult.public_id,
    rawText,
    parsedSections,
  });

  sendSuccess(res, 201, "Resume uploaded and parsed successfully", {
    resumeId:       resume._id,
    fileName:       resume.fileName,
    fileType:       resume.fileType,
    fileSizeKB:     Math.round(resume.fileSize / 1024),
    fileUrl:        resume.fileUrl,
    parsedSections: resume.parsedSections,
    uploadedAt:     resume.createdAt,
  });
});

// ─── @route   POST /api/resume/analyze/:id ────────────────────────────────────
// ─── @access  Private
// ─── @desc    Run Gemini AI analysis on an already-uploaded resume
export const analyzeResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) {
    res.status(404);
    throw new Error("Resume not found");
  }

  if (!resume.rawText || resume.rawText.length < 50) {
    res.status(422);
    throw new Error("Resume has no extractable text to analyze.");
  }

  // jobDescription can be sent in request body (optional)
  const jobDescription = req.body.jobDescription || resume.jobDescription || "";

  // Call Gemini
  let aiResult;
  try {
    aiResult = await analyzeResumeAI(resume.rawText, jobDescription);
  } catch (err) {
    res.status(502);
    throw new Error(`AI analysis failed: ${err.message}`);
  }

  // Save analysis to ResumeAnalysis collection
  const analysis = await ResumeAnalysis.create({
    user:         req.user._id,
    resume:       resume._id,
    overallScore: aiResult.atsScore,
    matchScore:   jobDescription ? aiResult.atsScore : null,
    strengths:    aiResult.matchedSkills,
    weaknesses:   aiResult.redFlags,
    skillsFound:  aiResult.matchedSkills,
    skillsGap:    aiResult.missingSkills,
    improvements: aiResult.suggestions,
  });

  // Mark resume as analyzed
  await Resume.findByIdAndUpdate(resume._id, { isAnalyzed: true });

  sendSuccess(res, 200, "Resume analyzed successfully", {
    analysisId:      analysis._id,
    atsScore:        aiResult.atsScore,
    scoreBreakdown:  aiResult.scoreBreakdown,
    matchedSkills:   aiResult.matchedSkills,
    missingSkills:   aiResult.missingSkills,
    weakBullets:     aiResult.weakBullets,
    improvedBullets: aiResult.improvedBullets,
    redFlags:        aiResult.redFlags,
    suggestions:     aiResult.suggestions,
    summary:         aiResult.summary,
  });
});

// ─── @route   GET /api/resume ─────────────────────────────────────────────────
export const getMyResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id })
    .select("-rawText")
    .sort({ createdAt: -1 });
  sendSuccess(res, 200, "Resumes fetched", { count: resumes.length, resumes });
});

// ─── @route   GET /api/resume/:id ─────────────────────────────────────────────
export const getResumeById = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) { res.status(404); throw new Error("Resume not found"); }
  sendSuccess(res, 200, "Resume fetched", resume);
});

// ─── @route   DELETE /api/resume/:id ──────────────────────────────────────────
export const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) { res.status(404); throw new Error("Resume not found"); }
  await cloudinary.uploader.destroy(resume.cloudinaryId, { resource_type: "raw" });
  await resume.deleteOne();
  sendSuccess(res, 200, "Resume deleted", { id: req.params.id });
});
