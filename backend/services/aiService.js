import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Confirmed working free-tier models (April 2025) ───────────────────────────
// gemini-2.5-flash → primary   (smartest, 10 RPM free tier)
// gemini-2.0-flash → fallback  (separate quota pool)
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

// ── Retry wait times per attempt before giving up on a model ─────────────────
const RETRY_DELAYS_MS = [8000, 20000]; // attempt 1 → 8s,  attempt 2 → 20s

// ── Keep prompts short to stay inside free-tier token limits ─────────────────
const truncate = (text, max = 4000) =>
  text?.length > max ? text.slice(0, max) + "\n...[truncated]" : text || "";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Core helper ──────────────────────────────────────────────────────────────
// Tries each model in MODELS with retries on 429 / 503 / overload errors.
// Only gives up when all models are exhausted.
const askGemini = async (prompt) => {
  let lastError;

  for (const modelName of MODELS) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        const mdl    = genAI.getGenerativeModel({ model: modelName });
        const result = await mdl.generateContent(prompt);
        const raw    = result.response.text();

        // Strip markdown fences Gemini sometimes wraps around JSON
        const cleaned = raw
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();

        try {
          return JSON.parse(cleaned);
        } catch {
          throw new Error(`Non-JSON from Gemini: ${cleaned.slice(0, 300)}`);
        }

      } catch (err) {
        lastError = err;
        const msg  = (err.message || "").toLowerCase();

        // Extract HTTP status code from error string e.g. "[503 Service..."
        const codeMatch = err.message?.match(/\[(\d{3})\s/);
        const code      = codeMatch ? parseInt(codeMatch[1]) : 0;

        // ── 404: model name invalid → skip to next model immediately ─────────
        if (code === 404 || msg.includes("not found")) {
          console.warn(`[AI] ${modelName} → 404 (deprecated model), trying next`);
          break; // exit inner loop, move to next model
        }

        // ── 429 / 503 / overload → retryable errors ───────────────────────────
        const isRetryable =
          code === 429 || code === 503   ||
          msg.includes("quota")          ||
          msg.includes("rate limit")     ||
          msg.includes("high demand")    ||
          msg.includes("overload")       ||
          msg.includes("unavailable")    ||
          msg.includes("service unavailable");

        if (isRetryable) {
          if (attempt < RETRY_DELAYS_MS.length) {
            const wait = RETRY_DELAYS_MS[attempt];
            console.warn(
              `[AI] ${modelName} → ${code || "overload"} (attempt ${attempt + 1}), waiting ${wait / 1000}s…`
            );
            await sleep(wait);
            continue; // retry same model after waiting
          }
          // All retries for this model exhausted → try next model
          console.warn(`[AI] ${modelName} → all retries exhausted, trying next model`);
          break;
        }

        // ── Any other error → surface it immediately (don't retry) ────────────
        throw err;
      }
    }
  }

  // ── All models failed — build a helpful error message ─────────────────────
  const raw  = lastError?.message || "";
  const hint =
    raw.includes("503") || raw.toLowerCase().includes("demand") || raw.toLowerCase().includes("unavailable")
      ? "Gemini servers are overloaded. Wait 30s and try again."
      : raw.includes("429") || raw.toLowerCase().includes("quota")
      ? "Free-tier limit hit (10 req/min). Wait 60s and retry."
      : raw.includes("404")
      ? "Model not found. Check your GEMINI_API_KEY is valid at aistudio.google.com."
      : "Unexpected error — check your server terminal for the full stack trace.";

  throw new Error(`Gemini failed on all models. ${hint}`);
};

// ════════════════════════════════════════════════════════════════════════════════
// 1. RESUME ANALYSIS
// ════════════════════════════════════════════════════════════════════════════════
export const analyzeResume = async (resumeText, jobDescription = "") => {
  const safeResume = truncate(resumeText, 4000);
  const safeJD     = truncate(jobDescription, 1500);

  const prompt = `You are a professional ATS expert and resume coach.
Analyze the resume${safeJD ? " against the job description" : ""} and return ONLY valid raw JSON — no explanation, no markdown.

Resume: """${safeResume}"""
${safeJD ? `Job Description: """${safeJD}"""` : ""}

Return EXACTLY this JSON structure:
{
  "atsScore": 0,
  "scoreBreakdown": { "relevance": 0, "keywords": 0, "formatting": 0, "experience": 0 },
  "matchedSkills": [],
  "missingSkills": [],
  "weakBullets": [{ "original": "", "reason": "" }],
  "improvedBullets": [{ "original": "", "improved": "" }],
  "redFlags": [],
  "suggestions": [],
  "summary": ""
}`;

  return askGemini(prompt);
};

// ════════════════════════════════════════════════════════════════════════════════
// 2. GENERATE INTERVIEW QUESTIONS
// ════════════════════════════════════════════════════════════════════════════════
export const generateInterviewQuestions = async (
  resumeText,
  jobDescription = "",
  role           = "Software Developer",
  config         = {}
) => {
  const { technical = 3, behavioral = 2, hr = 1, difficulty = "medium" } = config;
  const total      = Number(technical) + Number(behavioral) + Number(hr);
  const safeResume = truncate(resumeText, 2500);
  const safeJD     = truncate(jobDescription, 1000);

  const prompt = `You are a senior interviewer at a top tech company.
Generate exactly ${total} ${difficulty}-difficulty questions for a "${role}" candidate.
Breakdown: ${technical} technical, ${behavioral} behavioral, ${hr} HR.
Return ONLY a raw JSON array — no explanation, no markdown.

Resume: """${safeResume}"""
${safeJD ? `Job Description: """${safeJD}"""` : ""}

Return EXACTLY this JSON array with ${total} items:
[
  {
    "order": 1,
    "questionText": "question here",
    "category": "technical",
    "type": "domain",
    "difficulty": "${difficulty}",
    "hint": "what strong answer covers",
    "followUp": "natural follow-up question"
  }
]
category = technical | behavioral | hr
type = coding | system_design | domain | leadership | teamwork | conflict | motivation | culture_fit | salary | career_goals`;

  return askGemini(prompt);
};

// ════════════════════════════════════════════════════════════════════════════════
// 3. SCORE A SINGLE ANSWER
// ════════════════════════════════════════════════════════════════════════════════
export const scoreAnswer = async (question, userAnswer, role = "Software Developer") => {
  const prompt = `You are an expert interviewer for a "${role}" role.
Score this answer. Return ONLY raw JSON.

Question: ${question}
Answer: "${truncate(userAnswer, 1200) || "(no answer)"}"

Return EXACTLY:
{
  "score": 0,
  "feedback": "",
  "missedPoints": [],
  "betterAnswer": ""
}`;

  return askGemini(prompt);
};

// ════════════════════════════════════════════════════════════════════════════════
// 4. DEEP ANSWER EVALUATION — 6 dimensions (Step 8)
// ════════════════════════════════════════════════════════════════════════════════
export const evaluateAnswer = async (
  question,
  userAnswer,
  role     = "Software Developer",
  category = "technical"
) => {
  const prompt = `You are an expert interview coach evaluating a "${role}" candidate on a ${category} question.
Be specific and honest. Return ONLY raw JSON.

Question: ${question}
Answer: "${truncate(userAnswer, 1500) || "(no answer given)"}"

Return EXACTLY this JSON:
{
  "scores": {
    "relevance":         0,
    "clarity":           0,
    "technicalAccuracy": 0,
    "depth":             0,
    "confidence":        0,
    "overall":           0
  },
  "feedback": {
    "relevance":         "1 sentence",
    "clarity":           "1 sentence",
    "technicalAccuracy": "1 sentence",
    "depth":             "1 sentence",
    "confidence":        "1 sentence"
  },
  "overallFeedback":  "2-3 sentence honest overall assessment",
  "missedConcepts":   [],
  "improvedAnswer":   "model answer here",
  "grade":            "A"
}
All score values are integers 0-10. grade is one of: A, B, C, D, F.`;

  return askGemini(prompt);
};

// ════════════════════════════════════════════════════════════════════════════════
// 5. SESSION FEEDBACK REPORT
// ════════════════════════════════════════════════════════════════════════════════
export const generateSessionFeedback = async (questionsWithResponses, role) => {
  const qa = questionsWithResponses
    .slice(0, 15)  // summarize up to 15 Q&As
    .map((q, i) =>
      `Q${i + 1}[${q.category || "general"}]: ${q.questionText.slice(0, 120)}
Answer: ${(q.answerText || "(skipped)").slice(0, 400)}
Score: ${q.score}/10`
    )
    .join("\n\n");

  const prompt = `You are a career coach debriefing a mock interview for a "${role}" candidate.
Return ONLY raw JSON.

Interview:
"""${qa}"""

Return EXACTLY:
{
  "overallScore": 0,
  "communicationScore": 0,
  "technicalScore": 0,
  "confidenceScore": 0,
  "summary": "",
  "topStrengths": [],
  "areasToImprove": [],
  "recommendedTopics": [],
  "readyForInterview": false
}`;

  return askGemini(prompt);
};

// ════════════════════════════════════════════════════════════════════════════════
// FEATURE 1 — FOLLOW-UP QUESTION GENERATION
// ════════════════════════════════════════════════════════════════════════════════
export const generateFollowUp = async (originalQuestion, userAnswer, role = "Software Developer") => {
  const prompt = `You are a sharp interviewer for a "${role}" role.
The candidate just answered a question. Generate 3 probing follow-up questions
that dig deeper into gaps, assumptions, or weak claims in their answer.
Return ONLY raw JSON — no markdown.

Original Question: ${originalQuestion}
Candidate Answer: "${truncate(userAnswer, 800) || "(no answer)"}"

Return EXACTLY this JSON array (3 items):
[
  {
    "question":   "follow-up question text",
    "purpose":    "why this follow-up matters (1 sentence)",
    "difficulty": "easy | medium | hard",
    "targets":    "what weakness or claim this probes"
  }
]`;
  return askGemini(prompt);
};

// ════════════════════════════════════════════════════════════════════════════════
// FEATURE 2 — CONFIDENCE SCORING
// ════════════════════════════════════════════════════════════════════════════════
export const scoreConfidence = async (userAnswer, question, role = "Software Developer") => {
  const prompt = `You are an expert communication coach and interview assessor.
Analyse the confidence and communication quality of this interview answer.
Look for: hedging language (maybe/I think/kind of), filler words, vague claims,
lack of examples, passive voice, poor structure.
Return ONLY raw JSON — no markdown.

Question: ${question}
Answer: "${truncate(userAnswer, 1000) || "(no answer)"}"
Role: ${role}

Return EXACTLY this JSON:
{
  "overallConfidence": <integer 0-100>,
  "dimensions": {
    "assertiveness": <integer 0-10>,
    "clarity":       <integer 0-10>,
    "specificity":   <integer 0-10>,
    "structure":     <integer 0-10>,
    "vocabulary":    <integer 0-10>
  },
  "positiveSignals": ["signal1"],
  "weaknessSignals": ["signal1"],
  "hedgingWords":    ["maybe", "kind of"],
  "fillerWords":     ["um", "like"],
  "rewrittenOpener": "A more confident way to start this answer",
  "tips": ["tip1", "tip2", "tip3"]
}`;
  return askGemini(prompt);
};

// ════════════════════════════════════════════════════════════════════════════════
// FEATURE 3 — RESUME VERSION COMPARISON
// ════════════════════════════════════════════════════════════════════════════════
export const compareResumes = async (resumeTextA, resumeTextB, labelA = "Version A", labelB = "Version B") => {
  const prompt = `You are an expert resume reviewer. Compare these two resume versions honestly.
Return ONLY raw JSON — no markdown.

${labelA}: """${truncate(resumeTextA, 2500)}"""
${labelB}: """${truncate(resumeTextB, 2500)}"""

Return EXACTLY this JSON:
{
  "winner": "${labelA} | ${labelB} | tie",
  "scores": {
    "${labelA}": { "overall": 0, "impact": 0, "clarity": 0, "keywords": 0, "formatting": 0 },
    "${labelB}": { "overall": 0, "impact": 0, "clarity": 0, "keywords": 0, "formatting": 0 }
  },
  "improvements": { "${labelA}": [], "${labelB}": [] },
  "regressions":  { "${labelA}": [], "${labelB}": [] },
  "uniqueStrengths": { "${labelA}": [], "${labelB}": [] },
  "recommendation": "2-3 sentence recommendation on which to use and why",
  "bestOfBoth": "What the perfect combined version would include"
}`;
  return askGemini(prompt);
};

// ════════════════════════════════════════════════════════════════════════════════
// FEATURE 4 — REJECTION REASON SIMULATION
// ════════════════════════════════════════════════════════════════════════════════
export const simulateRejection = async (resumeText, jobDescription = "", role = "Software Developer") => {
  const jdBlock = jobDescription
    ? `Job Description: """${truncate(jobDescription, 1500)}"""`
    : "(No JD — simulate general rejection reasons)";

  const prompt = `You are a brutally honest senior recruiter who reviews 200 resumes a day.
Simulate why this resume might get rejected. Be specific and actionable.
Return ONLY raw JSON — no markdown.

Resume: """${truncate(resumeText, 3000)}"""
${jdBlock}
Role: ${role}

Return EXACTLY this JSON:
{
  "wouldReject": true,
  "rejectionProbability": <integer 0-100>,
  "atsFailures": [
    { "reason": "why ATS filters this", "fix": "how to fix" }
  ],
  "recruiterFailures": [
    { "reason": "why human rejects this", "fix": "how to fix" }
  ],
  "redFlags": [
    { "flag": "specific text", "severity": "high | medium | low", "explanation": "why this hurts" }
  ],
  "missingKeywords": ["keyword1"],
  "passSection": "What parts survive review",
  "priorityFixes": ["most important first", "second", "third"],
  "rejectEmailSimulation": "A realistic fictional rejection email"
}`;
  return askGemini(prompt);
};