import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import {
  TrendingUp, ArrowLeft, Loader as LoaderIcon,
  CheckCircle, XCircle, AlertTriangle, Lightbulb,
} from "lucide-react";

// Animated gauge bar
const GaugeBar = ({ label, value, max = 10, color = "brand" }) => {
  const pct = (value / max) * 100;
  const clr = { brand: "bg-brand", acid: "bg-acid", sky: "bg-sky-400", rose: "bg-rose-400", yellow: "bg-yellow-400" }[color];
  const txt = { brand: "text-brand", acid: "text-acid", sky: "text-sky-400", rose: "text-rose-400", yellow: "text-yellow-400" }[color];
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/50">{label}</span>
        <span className={`font-mono font-semibold ${txt}`}>{value}/{max}</span>
      </div>
      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full ${clr} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// Big confidence ring
const ConfidenceRing = ({ score }) => {
  const r     = 54;
  const circ  = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color  = score >= 70 ? "#C8FF00" : score >= 45 ? "#6C63FF" : "#f87171";
  const label  = score >= 70 ? "High Confidence" : score >= 45 ? "Moderate" : "Low Confidence";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 128 128" className="-rotate-90 w-36 h-36">
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-4xl" style={{ color }}>{score}</span>
          <span className="text-xs text-white/40">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-display font-semibold" style={{ color }}>{label}</span>
    </div>
  );
};

export default function ConfidencePage() {
  const navigate = useNavigate();
  const [question,   setQuestion]   = useState("");
  const [answerText, setAnswerText] = useState("");
  const [role,       setRole]       = useState("Software Developer");
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);

  const analyze = async () => {
    if (!answerText.trim()) { toast.error("Paste an answer to analyze"); return; }
    if (!question.trim())   { toast.error("Add the question that was asked"); return; }
    setLoading(true); setResult(null);
    try {
      const { data } = await api.post("/advanced/confidence", {
        question: question,
        answerText,
        role,
      });
      setResult(data.data);
      toast.success("Confidence analysis complete!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Analysis failed");
    } finally { setLoading(false); }
  };

  const DIM_COLORS = ["brand", "sky", "acid", "rose", "yellow"];
  const dims = result ? Object.entries(result.dimensions || {}) : [];

  return (
    <div className="min-h-screen bg-ink relative">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
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
              <TrendingUp size={22} className="text-sky-400" />
              Confidence Scorer
            </h1>
            <p className="text-white/40 text-sm mt-0.5">AI analyses your language, structure and assertiveness</p>
          </div>
        </div>

        {/* Input panel */}
        <div className="glass rounded-2xl p-6 mb-6 space-y-4 animate-fade-up opacity-0 animate-delay-100"
          style={{ animationFillMode: "forwards" }}>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-mono block mb-1.5">
              Role <span className="text-white/25">(context for scoring)</span>
            </label>
            <input value={role} onChange={e => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer, Data Analyst…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-400/40 placeholder:text-white/15 transition-all" />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-mono block mb-1.5">Question Asked</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2}
              placeholder="e.g. Tell me about a time you handled a conflict with a teammate…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-400/40 placeholder:text-white/15 resize-none transition-all" />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-mono block mb-1.5">
              Your Answer <span className="text-white/25">(paste exactly what you said/wrote)</span>
            </label>
            <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} rows={6}
              placeholder="In my previous role I think I handled it okay… like I kind of talked to them and basically we figured it out…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-400/40 placeholder:text-white/15 resize-none transition-all leading-relaxed" />
            <p className="text-right text-xs text-white/20 mt-1">{answerText.length} chars</p>
          </div>
          <button onClick={analyze} disabled={loading || !answerText.trim() || !question.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-brand text-white font-display font-bold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
            {loading ? <><LoaderIcon size={15} className="animate-spin" /> Analyzing…</> : <><TrendingUp size={15} /> Analyze Confidence</>}
          </button>
        </div>

        {loading && <Loader text="AI is analysing your language patterns…" />}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-5 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>

            {/* Score hero */}
            <div className="glass rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
              <ConfidenceRing score={result.overallConfidence} />
              <div className="flex-1 space-y-3">
                <p className="text-xs text-white/40 uppercase tracking-wider font-mono">5 Dimensions</p>
                {dims.map(([key, val], i) => (
                  <GaugeBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={val} max={10} color={DIM_COLORS[i % DIM_COLORS.length]} />
                ))}
              </div>
            </div>

            {/* Signals */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Positive */}
              <div className="glass rounded-2xl p-5 border border-acid/15">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={14} className="text-acid" />
                  <p className="font-display font-semibold text-sm text-acid">Positive Signals</p>
                </div>
                {result.positiveSignals?.length > 0
                  ? <ul className="space-y-1.5">{result.positiveSignals.map((s, i) => (
                    <li key={i} className="text-xs text-white/60 flex gap-2"><span className="text-acid/60">✓</span>{s}</li>
                  ))}</ul>
                  : <p className="text-xs text-white/30">None detected</p>}
              </div>

              {/* Weakness */}
              <div className="glass rounded-2xl p-5 border border-red-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle size={14} className="text-red-400" />
                  <p className="font-display font-semibold text-sm text-red-400">Weakness Signals</p>
                </div>
                {result.weaknessSignals?.length > 0
                  ? <ul className="space-y-1.5">{result.weaknessSignals.map((s, i) => (
                    <li key={i} className="text-xs text-white/60 flex gap-2"><span className="text-red-400/60">✗</span>{s}</li>
                  ))}</ul>
                  : <p className="text-xs text-white/30">None detected</p>}
              </div>
            </div>

            {/* Filler / hedging words */}
            {(result.hedgingWords?.length > 0 || result.fillerWords?.length > 0) && (
              <div className="glass rounded-2xl p-5 border border-yellow-500/15">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={14} className="text-yellow-400" />
                  <p className="font-display font-semibold text-sm text-yellow-400">Words to Eliminate</p>
                </div>
                <div className="space-y-3">
                  {result.hedgingWords?.length > 0 && (
                    <div>
                      <p className="text-xs text-white/30 font-mono mb-2">Hedging words found</p>
                      <div className="flex flex-wrap gap-2">
                        {result.hedgingWords.map((w, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono">
                            "{w}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.fillerWords?.length > 0 && (
                    <div>
                      <p className="text-xs text-white/30 font-mono mb-2">Filler words found</p>
                      <div className="flex flex-wrap gap-2">
                        {result.fillerWords.map((w, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
                            "{w}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rewritten opener */}
            {result.rewrittenOpener && (
              <div className="glass rounded-2xl p-5 border border-brand/20">
                <p className="text-xs text-brand font-mono uppercase tracking-wider mb-2">More Confident Opener</p>
                <p className="text-sm text-white/80 italic leading-relaxed">"{result.rewrittenOpener}"</p>
              </div>
            )}

            {/* Tips */}
            {result.tips?.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={14} className="text-brand" />
                  <p className="font-display font-semibold text-sm">Improvement Tips</p>
                </div>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-white/60 flex gap-2">
                      <span className="text-brand/60 mt-0.5 flex-shrink-0">{i + 1}.</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}