import express    from "express";
import cors       from "cors";
import morgan     from "morgan";
import dotenv     from "dotenv";
import { connectDB }              from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes       from "./routes/authRoutes.js";
import resumeRoutes     from "./routes/resumeRoutes.js";
import interviewRoutes  from "./routes/interviewRoutes.js";
import feedbackRoutes   from "./routes/feedbackRoutes.js";
import evaluationRoutes from "./routes/evaluationRoutes.js";
import dashboardRoutes  from "./routes/dashboardRoutes.js";
import advancedRoutes   from "./routes/advancedRoutes.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "HireLens AI 🚀", env: process.env.NODE_ENV })
);

// ── All API routes ────────────────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/resume",     resumeRoutes);
app.use("/api/interview",  interviewRoutes);
app.use("/api/feedback",   feedbackRoutes);
app.use("/api/evaluate",   evaluationRoutes);
app.use("/api/dashboard",  dashboardRoutes);
app.use("/api/advanced",   advancedRoutes);

// ── Error handlers — must be last ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () =>
  console.log(`✅ Server [${process.env.NODE_ENV}] running on port ${PORT}`)
);