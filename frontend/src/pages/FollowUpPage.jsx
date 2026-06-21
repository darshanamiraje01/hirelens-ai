import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import {
  MessageSquare, ChevronRight, Target, Zap,
  AlertCircle, ArrowLeft, Send, Loader as LoaderIcon,
} from "lucide-react";

const DIFF_STYLE = {
  easy:   "text-acid   border-acid/30   bg-acid/10",
  medium: "text-brand  border-brand/30  bg-brand/10",
  hard:   "text-rose-400 border-rose-400/30 bg-rose-400/10",
};

// Accepts ?questionId=xxx&sessionId=xxx&role=xxx via query params OR via location state
export default function FollowUpPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Can receive question info via route state or manual entry
  const [questionId,   setQuestionId]   = useState(state?.questionId   || "");
  const [sessionId,    setSessionId]    = useState(state?.sessionId    || "");
  const [role,         setRole]         = useState(state?.role         || "Software Developer");
  const [questionText, setQuestionText] = useState(state?.questionText || "");
  const [userAnswer,   setUserAnswer]   = useState(state?.userAnswer   || "");

  const [followUps,  setFollowUps]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [answering,  setAnswering]  = useState(null); // index of follow-up being answered
  const [answers,    setAnswers]    = useState({});   // { [index]: string }
  const [submitting, setSubmitting] = useState(false);

  // Auto-generate if arrived with a questionId from results page
  useEffect(() => {
    if (state?.questionId && state?.autoGenerate) generate();
  }, []);

  const generate = async () => {
    if (!questionId && !questionText) {
      toast.error("Enter a question ID or question text"); return;
    }
    setLoading(true); setFollowUps(null);
    try {
      const { data } = await api.post("/advanced/followup", {
        questionId: questionId || undefined,
        sessionId:  sessionId  || undefined,
        role,
      });
      setFollowUps(data.data);
      if (data.data.originalQuestion) setQuestionText(data.data.originalQuestion);
      if (data.data.yourAnswer)       setUserAnswer(data.data.yourAnswer);
      toast.success("Follow-up questions generated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation failed");
    } finally { setLoading(false); }
  };

  const submitFollowUpAnswer = async (idx) => {
    if (!answers[idx]?.trim()) { toast.error("Type an answer first"); return; }
    setSubmitting(true);
    try {
      // Score this follow-up answer using the evaluate endpoint
      const { data } = await api.post("/evaluate/answer", {
        question:   followUps.followUps[idx].question,
        answerText: answers[idx],
        role,
      });
      toast.success(`Scored: ${data.data.scores?.overall ?? "—"}/10`);
      setAnswering(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Scoring failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-ink relative">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand/6 rounded-full blur-[120px] pointer-events-none z-0" />
      <Navbar />

      <main className="relative z-10 max-w-3xl mx-auto px-4 pt-28 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <MessageSquare size={22} className="text-brand" />
              Follow-Up Generator
            </h1>
            <p className="text-white/40 text-sm mt-0.5">AI drills deeper into your answers</p>
          </div>
        </div>

        {/* Config panel */}
        <div className="glass rounded-2xl p-6 mb-6 animate-fade-up opacity-0 animate-delay-100"
          style={{ animationFillMode: "forwards" }}>
          <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-4">Configuration</p>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 block mb-1.5">Question ID <span className="text-white/25">(from DB)</span></label>
                <input value={questionId} onChange={e => setQuestionId(e.target.value)}
                  placeholder="MongoDB ObjectId…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand/40 placeholder:text-white/15 transition-all font-mono" />
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1.5">Role</label>
                <input value={role} onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Frontend Developer"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand/40 placeholder:text-white/15 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1.5">Or paste question text directly</label>
              <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} rows={2}
                placeholder="Explain the difference between useMemo and useCallback…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand/40 placeholder:text-white/15 resize-none transition-all" />
            </div>
            <button onClick={generate} disabled={loading || (!questionId && !questionText)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-gradient text-white font-display font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
              {loading ? <><LoaderIcon size={14} className="animate-spin" /> Generating…</> : <><Zap size={14} /> Generate Follow-Ups</>}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && <Loader text="AI is crafting probing follow-up questions…" />}

        {/* Results */}
        {followUps && !loading && (
          <div className="space-y-4 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
            {/* Context recap */}
            {followUps.originalQuestion && (
              <div className="glass rounded-2xl p-5 border border-white/8">
                <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2">Original Question</p>
                <p className="text-sm text-white/80 leading-relaxed">{followUps.originalQuestion}</p>
                {followUps.yourAnswer && (
                  <>
                    <p className="text-xs text-white/40 uppercase tracking-wider font-mono mt-3 mb-2">Your Answer</p>
                    <p className="text-sm text-white/50 leading-relaxed italic">"{followUps.yourAnswer}"</p>
                  </>
                )}
              </div>
            )}

            {/* Follow-up cards */}
            <p className="text-xs text-white/40 uppercase tracking-wider font-mono">
              3 AI-Generated Follow-Ups
            </p>
            {followUps.followUps?.map((fu, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden border border-white/8 hover:border-white/15 transition-all">
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-brand/15 border border-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-mono font-bold text-brand">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-semibold text-base leading-relaxed">{fu.question}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border capitalize flex-shrink-0 ${DIFF_STYLE[fu.difficulty] || DIFF_STYLE.medium}`}>
                      {fu.difficulty}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <div className="bg-white/3 rounded-xl p-3">
                      <p className="text-xs text-white/35 font-mono mb-1">Purpose</p>
                      <p className="text-xs text-white/60">{fu.purpose}</p>
                    </div>
                    <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3">
                      <p className="text-xs text-yellow-400/70 font-mono mb-1">Targets</p>
                      <p className="text-xs text-white/60">{fu.targets}</p>
                    </div>
                  </div>

                  {/* Practice answer toggle */}
                  <button
                    onClick={() => setAnswering(answering === i ? null : i)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-brand hover:text-brand-light transition-colors">
                    <ChevronRight size={12} className={`transition-transform ${answering === i ? "rotate-90" : ""}`} />
                    {answering === i ? "Hide practice" : "Practice this question"}
                  </button>
                </div>

                {/* Practice area */}
                {answering === i && (
                  <div className="border-t border-white/8 p-5 bg-white/2 animate-fade-in">
                    <textarea
                      value={answers[i] || ""}
                      onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                      rows={4}
                      placeholder="Type your answer to this follow-up…"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand/40 placeholder:text-white/15 resize-none transition-all mb-3" />
                    <button
                      onClick={() => submitFollowUpAnswer(i)}
                      disabled={submitting || !answers[i]?.trim()}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient text-white text-sm font-display font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
                      {submitting ? <><LoaderIcon size={13} className="animate-spin" /> Scoring…</> : <><Send size={13} /> Submit & Score</>}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}