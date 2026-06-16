import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/common/PageLayout.jsx";
import Navbar from "../components/common/Navbar.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import {
  Mic, ChevronRight, Loader, Clock, Send, SkipForward,
  Settings, Lightbulb, AlertCircle, CheckCircle, XCircle,
  MessageSquare, TrendingUp, Eye, EyeOff, ChevronDown, Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable sub-components
// ─────────────────────────────────────────────────────────────────────────────

const DIFFICULTIES = ["easy", "medium", "hard"];

const CAT_STYLES = {
  technical: { text: "text-brand",   border: "border-brand/30",   bg: "bg-brand/10",   dot: "bg-brand"   },
  behavioral:{ text: "text-sky-400", border: "border-sky-400/30", bg: "bg-sky-400/10", dot: "bg-sky-400" },
  hr:        { text: "text-rose-400",border: "border-rose-400/30",bg: "bg-rose-400/10",dot: "bg-rose-400"},
};

const ScoreCircle = ({ score }) => {
  const color = score >= 8 ? "#C8FF00" : score >= 5 ? "#6C63FF" : "#f87171";
  const grade = score >= 8 ? "A" : score >= 6 ? "B" : score >= 4 ? "C" : score >= 2 ? "D" : "F";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="-rotate-90 w-16 h-16">
          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
          <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={2 * Math.PI * 26}
            strokeDashoffset={2 * Math.PI * 26 * (1 - score / 10)}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-lg" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>Grade {grade}</span>
    </div>
  );
};

const FeedbackPanel = ({ feedback, onNext, isLast }) => (
  <div className="animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
    {/* Score + overall */}
    <div className="glass rounded-2xl p-6 mb-4 flex gap-6 items-start">
      <ScoreCircle score={feedback.score} />
      <div className="flex-1">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-mono">AI Feedback</p>
        <p className="text-sm text-white/80 leading-relaxed">{feedback.feedback}</p>
      </div>
    </div>

    {/* Missed points */}
    {feedback.missedPoints?.length > 0 && (
      <div className="glass rounded-2xl p-5 mb-4 border border-yellow-500/15">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={14} className="text-yellow-400" />
          <p className="text-sm font-display font-semibold text-yellow-400">Missed Concepts</p>
        </div>
        <ul className="space-y-1.5">
          {feedback.missedPoints.map((p, i) => (
            <li key={i} className="text-xs text-white/60 flex gap-2">
              <span className="text-yellow-400/60 mt-0.5">•</span>{p}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Better answer */}
    {feedback.betterAnswer && (
      <div className="glass rounded-2xl p-5 mb-5 border border-acid/15">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-acid" />
          <p className="text-sm font-display font-semibold text-acid">Model Answer</p>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">{feedback.betterAnswer}</p>
      </div>
    )}

    {/* Next / finish */}
    <button onClick={onNext}
      className="w-full flex items-center justify-center gap-2 py-4 bg-brand-gradient text-white font-display font-bold rounded-2xl hover:opacity-90 transition-opacity glow-brand">
      {isLast
        ? <><Zap size={17} /> View Full Results</>
        : <><ChevronRight size={17} /> Next Question</>}
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Question mini-map sidebar
// ─────────────────────────────────────────────────────────────────────────────
const QuestionMap = ({ questions, current, answered }) => (
  <div className="glass rounded-2xl p-4">
    <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-3">Question Map</p>
    <div className="flex flex-wrap gap-2">
      {questions.map((q, i) => {
        const isCurrent  = i === current;
        const isAnswered = answered.has(i);
        const cs = CAT_STYLES[q.category] || CAT_STYLES.technical;
        return (
          <div key={i} title={`Q${i + 1}: ${q.category}`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold border transition-all
              ${isCurrent  ? `${cs.bg} ${cs.border} ${cs.text} scale-110 shadow-lg` :
                isAnswered ? "bg-white/10 border-white/15 text-white/50" :
                             "bg-white/3 border-white/8 text-white/20"}`}>
            {isAnswered && !isCurrent ? <CheckCircle size={12} className="text-white/40" /> : i + 1}
          </div>
        );
      })}
    </div>
    <div className="flex gap-3 mt-3 pt-3 border-t border-white/8">
      {Object.entries(CAT_STYLES).map(([cat, s]) => (
        <div key={cat} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className="text-xs text-white/30 capitalize">{cat}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function MockInterview() {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const answerRef = useRef(null);

  // ── Config state ────────────────────────────────────────────────────────────
  const [step,       setStep]       = useState("config");
  const [role,       setRole]       = useState("");
  const [jd,         setJd]         = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [technical,  setTechnical]  = useState(3);
  const [behavioral, setBehavioral] = useState(2);
  const [hr,         setHr]         = useState(1);
  const [resumes,    setResumes]    = useState([]);
  const [resumeId,   setResumeId]   = useState("");
  const [loading,    setLoading]    = useState(false);

  // ── Interview state ─────────────────────────────────────────────────────────
  const [sessionId,  setSessionId]  = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [qIndex,     setQIndex]     = useState(0);
  const [answer,     setAnswer]     = useState("");
  const [elapsed,    setElapsed]    = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [feedback,   setFeedback]   = useState(null);   // inline feedback after each answer
  const [answered,   setAnswered]   = useState(new Set());
  const [showHint,   setShowHint]   = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const total = Number(technical) + Number(behavioral) + Number(hr);

  // Load resumes for dropdown
  useEffect(() => {
    api.get("/resume").then(r => setResumes(r.data.data.resumes || [])).catch(() => {});
  }, []);

  // Per-question timer
  useEffect(() => {
    if (step !== "interview" || feedback) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [step, qIndex, feedback]);

  // Auto-focus textarea when question changes
  useEffect(() => {
    if (step === "interview" && !feedback) answerRef.current?.focus();
  }, [qIndex, step, feedback]);

  // Reset hint/followup on new question
  useEffect(() => {
    setShowHint(false);
    setShowFollowUp(false);
  }, [qIndex]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const startSession = async () => {
    if (!role.trim()) { toast.error("Enter a target role first"); return; }
    if (total === 0)  { toast.error("Set at least 1 question"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/interview/start", {
        role, resumeId: resumeId || undefined,
        jobDescriptionText: jd, difficulty,
        technical, behavioral, hr,
      });
      setSessionId(data.data.sessionId);
      setQuestions(data.data.questions);
      setStep("interview");
      toast.success(`${data.data.questions.length} questions ready!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate questions");
    } finally { setLoading(false); }
  };

  const submitAnswer = async (skip = false) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const { data } = await api.post("/interview/answer", {
        sessionId,
        questionId:    questions[qIndex].questionId,
        answerText:    skip ? "" : answer,
        timeTakenSecs: elapsed,
      });
      // Show inline feedback immediately
      setFeedback(data.data);
      setAnswered(prev => new Set([...prev, qIndex]));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error submitting answer");
      clearInterval(timerRef.current);
    } finally { setSubmitting(false); }
  };

  const goNext = useCallback(async () => {
    setFeedback(null);
    setAnswer("");
    setElapsed(0);
    if (qIndex + 1 < questions.length) {
      setQIndex(i => i + 1);
    } else {
      // All answered — finish session
      setStep("submitting");
      try {
        await api.patch(`/interview/end/${sessionId}`);
        navigate(`/interview/results/${sessionId}`);
      } catch (err) {
        toast.error(err.response?.data?.message || "Error finishing session");
        setStep("interview");
      }
    }
  }, [qIndex, questions.length, sessionId, navigate]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ════════════════════════════════════════════════════════════════════════════
  // CONFIG SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "config") return (
    <div className="min-h-screen bg-ink relative">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand/6 rounded-full blur-[130px] pointer-events-none z-0" />
      <Navbar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-16">
        <div className="mb-8 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <h1 className="font-display text-3xl font-bold">Setup Interview</h1>
          <p className="text-white/40 text-sm mt-1">Tailored questions. Real feedback. Zero fluff.</p>
        </div>

        <div className="space-y-4 animate-fade-up opacity-0 animate-delay-100" style={{ animationFillMode: "forwards" }}>

          {/* Role */}
          <div className="glass rounded-2xl p-5">
            <label className="text-xs text-white/50 uppercase tracking-wider font-mono block mb-2">
              Target Role <span className="text-brand">*</span>
            </label>
            <input value={role} onChange={e => setRole(e.target.value)}
              onKeyDown={e => e.key === "Enter" && startSession()}
              placeholder="e.g. Frontend Developer, SDE-1, Data Analyst…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none
                focus:border-brand/50 focus:bg-brand/5 placeholder:text-white/20 transition-all" />
          </div>

          {/* Resume picker */}
          {resumes.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <label className="text-xs text-white/50 uppercase tracking-wider font-mono block mb-2">
                Resume <span className="text-white/30">(optional — personalizes questions)</span>
              </label>
              <select value={resumeId} onChange={e => setResumeId(e.target.value)}
                className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-sm outline-none
                  focus:border-brand/40 transition-all text-white">
                <option value="">No resume — use generic questions</option>
                {resumes.map(r => <option key={r._id} value={r._id}>{r.fileName}</option>)}
              </select>
            </div>
          )}

          {/* Difficulty */}
          <div className="glass rounded-2xl p-5">
            <label className="text-xs text-white/50 uppercase tracking-wider font-mono block mb-3">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`py-3 rounded-xl text-sm font-display font-semibold capitalize border transition-all
                    ${difficulty === d
                      ? d === "easy"   ? "bg-acid/20 border-acid text-acid"
                      : d === "medium" ? "bg-brand/20 border-brand text-brand"
                                       : "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Question breakdown */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs text-white/50 uppercase tracking-wider font-mono flex items-center gap-2">
                <Settings size={13} /> Question Mix
              </label>
              <span className="text-sm font-display font-bold text-brand">{total} total</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Technical",  val: technical,  set: setTechnical,  cat: "technical"  },
                { label: "Behavioral", val: behavioral, set: setBehavioral, cat: "behavioral" },
                { label: "HR",         val: hr,         set: setHr,         cat: "hr"         },
              ].map(({ label, val, set, cat }) => {
                const cs = CAT_STYLES[cat];
                return (
                  <div key={cat} className={`rounded-xl border p-3 text-center ${cs.bg} ${cs.border}`}>
                    <p className={`text-xs font-mono mb-2 ${cs.text}`}>{label}</p>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => set(v => Math.max(0, v - 1))}
                        className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 transition-colors text-base leading-none">−</button>
                      <span className={`font-display font-bold text-2xl w-6 ${cs.text}`}>{val}</span>
                      <button onClick={() => set(v => Math.min(10, v + 1))}
                        className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 transition-colors text-base leading-none">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-white/25 text-center mt-3">Max 10 per category · 30 total</p>
          </div>

          {/* Job description */}
          <div className="glass rounded-2xl p-5">
            <label className="text-xs text-white/50 uppercase tracking-wider font-mono block mb-2">
              Job Description <span className="text-white/30">(optional — improves targeting)</span>
            </label>
            <textarea value={jd} onChange={e => setJd(e.target.value)} rows={3}
              placeholder="Paste the JD here for laser-targeted questions…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none
                focus:border-brand/40 placeholder:text-white/20 resize-none transition-all" />
          </div>

          {/* Start button */}
          <button onClick={startSession} disabled={loading || !role.trim() || total === 0}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl
              font-display font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed
              bg-brand-gradient text-white hover:opacity-90 glow-brand">
            {loading
              ? <><Loader size={18} className="animate-spin" /> Generating {total} questions…</>
              : <><Mic size={18} /> Start Interview</>}
          </button>
        </div>
      </main>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // FINISHING SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "submitting") return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-5">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand/15 border border-brand/20 flex items-center justify-center mb-2">
          <div className="w-8 h-8 border-2 border-brand/40 border-t-brand rounded-full animate-spin" />
        </div>
        <h2 className="font-display text-2xl font-bold">Finalizing Results…</h2>
        <p className="text-white/40 text-sm max-w-xs">AI is reviewing all your answers and generating your personalized feedback report</p>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-brand rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // INTERVIEW SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  const q  = questions[qIndex];
  if (!q) return null;

  const cs       = CAT_STYLES[q.category] || CAT_STYLES.technical;
  const progress = (answered.size / questions.length) * 100;
  const isLast   = qIndex + 1 === questions.length;
  const timeWarn = elapsed > 120;

  return (
    <div className="min-h-screen bg-ink relative">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none z-0" />
      <Navbar />

      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          {/* Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
              <span className="font-mono">{answered.size}/{questions.length} answered</span>
              <span className={`flex items-center gap-1.5 font-mono text-sm font-semibold transition-colors
                ${timeWarn ? "text-red-400" : "text-white/60"}`}>
                <Clock size={13} className={timeWarn ? "text-red-400 animate-pulse" : ""} />
                {fmt(elapsed)}
              </span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-brand-gradient rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Role badge */}
          <div className="hidden sm:flex items-center gap-2 glass px-3 py-1.5 rounded-xl text-xs text-white/50">
            <Mic size={12} className="text-brand" />
            {role}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_260px] gap-5 items-start">
          {/* ── Main column ───────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Question card */}
            <div key={qIndex} className="glass rounded-3xl p-7 border border-white/10 animate-fade-up opacity-0"
              style={{ animationFillMode: "forwards" }}>

              {/* Category + meta */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <span className={`text-xs font-medium px-3 py-1 rounded-full border capitalize ${cs.text} ${cs.border} ${cs.bg}`}>
                  {q.category}
                </span>
                <span className="text-xs text-white/30 px-2.5 py-1 rounded-full border border-white/10 capitalize bg-white/3">
                  {q.difficulty}
                </span>
                {q.type && (
                  <span className="text-xs text-white/25 px-2.5 py-1 rounded-full border border-white/8 capitalize bg-white/2">
                    {q.type.replace("_", " ")}
                  </span>
                )}
                <span className="ml-auto text-xs text-white/25 font-mono">
                  Q{qIndex + 1} of {questions.length}
                </span>
              </div>

              {/* Question text */}
              <p className="font-display text-xl font-semibold leading-relaxed mb-5">
                {q.questionText}
              </p>

              {/* Hint toggle */}
              {q.hint && (
                <button onClick={() => setShowHint(h => !h)}
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all mb-3
                    ${showHint ? "bg-brand/10 border-brand/30 text-brand" : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"}`}>
                  <Lightbulb size={12} />
                  {showHint ? "Hide hint" : "Show hint"}
                </button>
              )}
              {showHint && q.hint && (
                <div className="bg-brand/8 border border-brand/20 rounded-xl px-4 py-3 text-sm text-brand/80 mb-3 animate-fade-in">
                  💡 {q.hint}
                </div>
              )}

              {/* Follow-up toggle */}
              {q.followUp && (
                <button onClick={() => setShowFollowUp(f => !f)}
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all
                    ${showFollowUp ? "bg-sky-400/10 border-sky-400/30 text-sky-400" : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"}`}>
                  <MessageSquare size={12} />
                  {showFollowUp ? "Hide follow-up" : "See possible follow-up"}
                </button>
              )}
              {showFollowUp && q.followUp && (
                <div className="bg-sky-400/6 border border-sky-400/20 rounded-xl px-4 py-3 text-sm text-sky-300/80 mt-3 animate-fade-in">
                  🔁 Follow-up: {q.followUp}
                </div>
              )}
            </div>

            {/* ── Feedback panel (shown after submission) ─────────────── */}
            {feedback ? (
              <FeedbackPanel feedback={feedback} onNext={goNext} isLast={isLast} />
            ) : (
              <>
                {/* Answer textarea */}
                <div className={`glass rounded-2xl border transition-all ${answer.length > 0 ? "border-brand/25" : "border-white/10"}`}>
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <p className="text-xs text-white/40 font-mono uppercase tracking-wider">Your Answer</p>
                    <span className={`text-xs font-mono ${answer.length > 800 ? "text-yellow-400" : "text-white/20"}`}>
                      {answer.length} chars
                    </span>
                  </div>
                  <textarea
                    ref={answerRef}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    rows={7}
                    placeholder="Type your answer here…&#10;&#10;Tips:&#10;• Use specific examples from your experience&#10;• Structure with STAR method for behavioral questions&#10;• Be concise but complete"
                    className="w-full bg-transparent px-5 pb-4 text-sm outline-none resize-none leading-relaxed placeholder:text-white/15" />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button onClick={() => submitAnswer(true)} disabled={submitting}
                    className="flex items-center gap-2 px-5 py-3.5 glass border border-white/10 rounded-xl
                      text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all disabled:opacity-30">
                    <SkipForward size={15} />
                    Skip
                  </button>

                  <button onClick={() => submitAnswer(false)}
                    disabled={submitting || !answer.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl
                      font-display font-semibold text-sm transition-all
                      bg-brand-gradient text-white hover:opacity-90
                      disabled:opacity-40 disabled:cursor-not-allowed">
                    {submitting ? (
                      <><Loader size={16} className="animate-spin" /> Scoring your answer…</>
                    ) : isLast ? (
                      <><Send size={16} /> Submit Final Answer</>
                    ) : (
                      <><ChevronRight size={16} /> Submit & Get Feedback</>
                    )}
                  </button>
                </div>

                {/* Keyboard shortcut hint */}
                <p className="text-center text-xs text-white/20">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/30">Ctrl+Enter</kbd> to submit
                </p>
              </>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <div className="space-y-4 hidden lg:block">
            {/* Question map */}
            <QuestionMap questions={questions} current={qIndex} answered={answered} />

            {/* Session stats */}
            <div className="glass rounded-2xl p-4 space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-wider font-mono">Session Stats</p>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Answered</span>
                <span className="font-mono font-semibold text-acid">{answered.size}/{questions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Role</span>
                <span className="font-mono text-xs text-white/70 truncate max-w-[120px]">{role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Difficulty</span>
                <span className={`font-mono text-xs capitalize
                  ${difficulty === "easy" ? "text-acid" : difficulty === "medium" ? "text-brand" : "text-rose-400"}`}>
                  {difficulty}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Time</span>
                <span className={`font-mono text-xs ${timeWarn ? "text-red-400" : "text-white/60"}`}>
                  {fmt(elapsed)}
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className="glass rounded-2xl p-4 border border-brand/15">
              <p className="text-xs text-brand/70 uppercase tracking-wider font-mono mb-3">Quick Tips</p>
              <ul className="space-y-2">
                {[
                  "Use the STAR method for behavioral questions",
                  "Quantify your answers with numbers",
                  "Be specific — avoid generic answers",
                  "It's okay to pause and think",
                ].map((tip, i) => (
                  <li key={i} className="text-xs text-white/40 flex gap-2 leading-relaxed">
                    <span className="text-brand/50 mt-0.5 flex-shrink-0">→</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
