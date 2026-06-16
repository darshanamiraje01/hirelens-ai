import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import api from "../api/axios.js";
import { CheckCircle, XCircle, AlertTriangle, ArrowUpRight, Lightbulb, Target, ChevronRight } from "lucide-react";

const ScoreRing = ({ score, size = 100 }) => {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#C8FF00" : score >= 50 ? "#6C63FF" : "#ff6b6b";
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  );
};

export default function AnalysisReport() {
  const { id }           = useParams();
  const [resume, setResume]    = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/resume/${id}`),
      api.get(`/resume/${id}`), // analysis stored in ResumeAnalysis — fetch via analyze endpoint when ready
    ]).then(([rRes]) => {
      setResume(rRes.data.data);
      // Trigger analysis if not done
      if (!rRes.data.data.isAnalyzed) {
        api.post(`/resume/analyze/${id}`, { jobDescription: rRes.data.data.jobDescription || "" })
          .then(aRes => setAnalysis(aRes.data.data))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        api.post(`/resume/analyze/${id}`, { jobDescription: rRes.data.data.jobDescription || "" })
          .then(aRes => setAnalysis(aRes.data.data))
          .catch(() => {}).finally(() => setLoading(false));
      }
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-ink flex items-center justify-center"><Navbar /><Loader text="Generating AI analysis…" /></div>;

  const score = analysis?.atsScore ?? 0;
  const scoreColor = score >= 70 ? "text-acid" : score >= 50 ? "text-brand" : "text-red-400";

  return (
    <div className="min-h-screen bg-ink">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-28 pb-12 space-y-6">
        {/* Header */}
        <div className="animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <h1 className="font-display text-3xl font-bold">Analysis Report</h1>
          <p className="text-white/40 text-sm mt-1">{resume?.fileName}</p>
        </div>

        {/* Score hero */}
        <div className="glass rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 animate-fade-up opacity-0 animate-delay-100" style={{ animationFillMode: "forwards" }}>
          <div className="relative flex-shrink-0">
            <ScoreRing score={score} size={140} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-display font-bold text-4xl ${scoreColor}`}>{score}</span>
              <span className="text-xs text-white/40">ATS Score</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold mb-1">{analysis?.summary || "Resume analyzed"}</h2>
            {analysis?.scoreBreakdown && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {Object.entries(analysis.scoreBreakdown).map(([k, v]) => (
                  <div key={k} className="bg-white/5 rounded-xl p-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="capitalize text-white/50">{k}</span>
                      <span className="font-mono text-white">{v}/25</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full">
                      <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${(v/25)*100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {analysis && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Matched skills */}
            <div className="glass rounded-2xl p-5 animate-fade-up opacity-0 animate-delay-200" style={{ animationFillMode: "forwards" }}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} className="text-acid" />
                <h3 className="font-display font-semibold">Matched Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.matchedSkills?.map(s => (
                  <span key={s} className="text-xs px-3 py-1 rounded-full bg-acid/10 text-acid border border-acid/20">{s}</span>
                ))}
                {!analysis.matchedSkills?.length && <p className="text-sm text-white/30">None detected</p>}
              </div>
            </div>

            {/* Missing skills */}
            <div className="glass rounded-2xl p-5 animate-fade-up opacity-0 animate-delay-300" style={{ animationFillMode: "forwards" }}>
              <div className="flex items-center gap-2 mb-4">
                <XCircle size={16} className="text-red-400" />
                <h3 className="font-display font-semibold">Missing Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills?.map(s => (
                  <span key={s} className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{s}</span>
                ))}
                {!analysis.missingSkills?.length && <p className="text-sm text-white/30">No gaps found</p>}
              </div>
            </div>

            {/* Red flags */}
            {analysis.redFlags?.length > 0 && (
              <div className="glass rounded-2xl p-5 animate-fade-up opacity-0 animate-delay-300" style={{ animationFillMode: "forwards" }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} className="text-yellow-400" />
                  <h3 className="font-display font-semibold">Red Flags</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.redFlags.map((f, i) => (
                    <li key={i} className="text-sm text-white/60 flex gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions?.length > 0 && (
              <div className="glass rounded-2xl p-5 animate-fade-up opacity-0 animate-delay-400" style={{ animationFillMode: "forwards" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={16} className="text-brand" />
                  <h3 className="font-display font-semibold">Suggestions</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-white/60 flex gap-2">
                      <span className="text-brand mt-0.5">→</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Improved bullets */}
        {analysis?.improvedBullets?.length > 0 && (
          <div className="glass rounded-2xl p-5 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight size={16} className="text-brand" />
              <h3 className="font-display font-semibold">Improved Bullet Points</h3>
            </div>
            <div className="space-y-4">
              {analysis.improvedBullets.map((b, i) => (
                <div key={i} className="grid md:grid-cols-2 gap-3">
                  <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                    <p className="text-xs text-red-400 mb-1">Original</p>
                    <p className="text-sm text-white/60">{b.original}</p>
                  </div>
                  <div className="bg-acid/5 border border-acid/15 rounded-xl p-3">
                    <p className="text-xs text-acid mb-1">Improved</p>
                    <p className="text-sm text-white/80">{b.improved}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link to="/interview/start"
          className="flex items-center justify-center gap-3 w-full py-4 bg-acid text-ink font-display font-bold rounded-2xl hover:bg-acid-dark transition-colors glow-acid animate-fade-up opacity-0"
          style={{ animationFillMode: "forwards" }}>
          <Target size={18} /> Start Mock Interview Based on This Resume
          <ChevronRight size={16} />
        </Link>
      </main>
    </div>
  );
}
