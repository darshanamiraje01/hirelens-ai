import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import {
  GitCompare, ArrowLeft, Trophy, TrendingUp,
  TrendingDown, AlertTriangle, Loader as LoaderIcon,
  FileText, Star,
} from "lucide-react";

// Score column for a single resume
const ScoreCol = ({ name, scores, isWinner }) => {
  const keys   = Object.keys(scores || {});
  const colors = ["brand", "sky", "acid", "rose", "yellow"];
  const barClr = { brand: "bg-brand", sky: "bg-sky-400", acid: "bg-acid", rose: "bg-rose-400", yellow: "bg-yellow-400" };

  return (
    <div className={`glass rounded-2xl p-5 flex-1 border transition-all
      ${isWinner ? "border-acid/40 shadow-lg shadow-acid/10" : "border-white/10"}`}>
      {isWinner && (
        <div className="flex items-center gap-1.5 text-acid text-xs font-mono mb-3">
          <Trophy size={12} /> Winner
        </div>
      )}
      <p className="font-display font-bold text-sm truncate mb-4">{name}</p>
      <div className="space-y-3">
        {keys.map((k, i) => (
          <div key={k}>
            <div className="flex justify-between text-xs mb-1">
              <span className="capitalize text-white/50">{k}</span>
              <span className={`font-mono font-semibold text-${colors[i % colors.length] === "brand" ? "brand" : colors[i % colors.length] + "-400"}`}>
                {scores[k]}/100
              </span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className={`h-full ${barClr[colors[i % colors.length]]} rounded-full transition-all duration-1000`}
                style={{ width: `${scores[k]}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CompareResumesPage() {
  const navigate = useNavigate();
  const [resumes,   setResumes]   = useState([]);
  const [resumeIdA, setResumeIdA] = useState("");
  const [resumeIdB, setResumeIdB] = useState("");
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    api.get("/resume").then(r => setResumes(r.data.data.resumes || [])).catch(() => {});
  }, []);

  const compare = async () => {
    if (!resumeIdA || !resumeIdB) { toast.error("Select both resumes"); return; }
    if (resumeIdA === resumeIdB)  { toast.error("Select two different resumes"); return; }
    setLoading(true); setResult(null);
    try {
      const { data } = await api.post("/advanced/compare", { resumeIdA, resumeIdB });
      setResult(data.data);
      toast.success("Comparison complete!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Comparison failed");
    } finally { setLoading(false); }
  };

  const nameA = resumes.find(r => r._id === resumeIdA)?.fileName || "Resume A";
  const nameB = resumes.find(r => r._id === resumeIdB)?.fileName || "Resume B";

  return (
    <div className="min-h-screen bg-ink relative">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-acid/4 rounded-full blur-[120px] pointer-events-none z-0" />
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-28 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <GitCompare size={22} className="text-acid" />
              Resume Comparator
            </h1>
            <p className="text-white/40 text-sm mt-0.5">Find out which version of your resume is stronger</p>
          </div>
        </div>

        {/* Selector */}
        <div className="glass rounded-2xl p-6 mb-6 animate-fade-up opacity-0 animate-delay-100"
          style={{ animationFillMode: "forwards" }}>
          {resumes.length < 2 ? (
            <div className="text-center py-6">
              <FileText size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm">You need at least 2 uploaded resumes to compare.</p>
              <button onClick={() => navigate("/resume/upload")}
                className="mt-3 text-xs text-brand hover:underline">Upload a resume →</button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-white/40 uppercase tracking-wider font-mono">Select Two Resumes</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Resume A", val: resumeIdA, set: setResumeIdA, accent: "brand" },
                  { label: "Resume B", val: resumeIdB, set: setResumeIdB, accent: "acid"  },
                ].map(({ label, val, set, accent }) => (
                  <div key={label}>
                    <label className={`text-xs font-mono mb-1.5 block text-${accent === "brand" ? "brand" : "acid"}`}>{label}</label>
                    <select value={val} onChange={e => set(e.target.value)}
                      className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/25 transition-all text-white">
                      <option value="">— Select resume —</option>
                      {resumes.map(r => <option key={r._id} value={r._id}>{r.fileName}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={compare} disabled={loading || !resumeIdA || !resumeIdB || resumeIdA === resumeIdB}
                className="flex items-center gap-2 px-6 py-3 bg-acid text-ink font-display font-bold rounded-xl text-sm hover:bg-acid-dark transition-colors disabled:opacity-40 glow-acid">
                {loading ? <><LoaderIcon size={15} className="animate-spin" /> Comparing…</> : <><GitCompare size={15} /> Compare Now</>}
              </button>
            </div>
          )}
        </div>

        {loading && <Loader text="AI is doing a deep comparison…" />}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-5 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>

            {/* Winner banner */}
            <div className={`rounded-2xl p-5 border text-center
              ${result.winner !== "tie" ? "bg-acid/8 border-acid/30" : "bg-brand/8 border-brand/30"}`}>
              <Trophy size={28} className={`mx-auto mb-2 ${result.winner !== "tie" ? "text-acid" : "text-brand"}`} />
              <p className="font-display font-bold text-xl">
                {result.winner === "tie" ? "It's a Tie! 🤝" : `${result.winner} wins`}
              </p>
              <p className="text-sm text-white/50 mt-1 max-w-lg mx-auto">{result.recommendation}</p>
            </div>

            {/* Score comparison */}
            {result.scores && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-3">Score Breakdown</p>
                <div className="flex gap-4">
                  <ScoreCol
                    name={nameA}
                    scores={result.scores[nameA] || result.scores[Object.keys(result.scores)[0]]}
                    isWinner={result.winner === nameA} />
                  <ScoreCol
                    name={nameB}
                    scores={result.scores[nameB] || result.scores[Object.keys(result.scores)[1]]}
                    isWinner={result.winner === nameB} />
                </div>
              </div>
            )}

            {/* Improvements + Regressions grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Unique strengths */}
              {result.uniqueStrengths && Object.entries(result.uniqueStrengths).map(([name, items]) => (
                items?.length > 0 && (
                  <div key={name} className="glass rounded-2xl p-5 border border-acid/15">
                    <div className="flex items-center gap-2 mb-3">
                      <Star size={13} className="text-acid" />
                      <p className="text-xs font-mono text-acid">Unique to {name.split(".")[0]}</p>
                    </div>
                    <ul className="space-y-1.5">
                      {items.map((it, i) => <li key={i} className="text-xs text-white/60 flex gap-2"><span className="text-acid/50">+</span>{it}</li>)}
                    </ul>
                  </div>
                )
              ))}

              {/* Regressions */}
              {result.regressions && Object.entries(result.regressions).map(([name, items]) => (
                items?.length > 0 && (
                  <div key={name} className="glass rounded-2xl p-5 border border-red-500/15">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown size={13} className="text-red-400" />
                      <p className="text-xs font-mono text-red-400">Weaker in {name.split(".")[0]}</p>
                    </div>
                    <ul className="space-y-1.5">
                      {items.map((it, i) => <li key={i} className="text-xs text-white/60 flex gap-2"><span className="text-red-400/50">−</span>{it}</li>)}
                    </ul>
                  </div>
                )
              ))}
            </div>

            {/* Best of both */}
            {result.bestOfBoth && (
              <div className="glass rounded-2xl p-5 border border-brand/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-brand" />
                  <p className="font-display font-semibold text-sm">The Perfect Version</p>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{result.bestOfBoth}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}