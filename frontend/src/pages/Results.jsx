import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import api from "../api/axios.js";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Trophy, Target, TrendingUp, BookOpen, ChevronDown, ChevronUp, RotateCcw, LayoutDashboard } from "lucide-react";

const ScoreBar = ({ label, value, color = "brand" }) => {
  const colors = { brand: "bg-brand", acid: "bg-acid", sky: "bg-sky-400", rose: "bg-rose-400" };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/50">{label}</span>
        <span className="font-mono text-white">{value}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full">
        <div className={`h-full ${colors[color]} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

export default function Results() {
  const { id }             = useParams();
  const [session, setSession]     = useState(null);
  const [feedback, setFeedback]   = useState(null);
  const [questions, setQuestions] = useState([]);
  const [expanded, setExpanded]   = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get(`/interview/session/${id}`)
      .then(r => {
        setSession(r.data.data.session);
        setQuestions(r.data.data.questionsWithAnswers || []);
        setFeedback(r.data.data.feedback);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-ink flex items-center justify-center"><Navbar /><Loader text="Loading results…" /></div>;

  const overall = feedback?.overallScore ?? 0;
  const ready   = feedback?.readyForInterview;
  const radarData = feedback ? [
    { subject: "Communication", A: feedback.communicationScore },
    { subject: "Technical",     A: feedback.technicalScore },
    { subject: "Confidence",    A: feedback.confidenceScore },
    { subject: "Overall",       A: feedback.overallScore },
  ] : [];

  const scoreColor = overall >= 70 ? "text-acid" : overall >= 50 ? "text-brand" : "text-red-400";
  const gradeColor = { A: "text-acid border-acid/30 bg-acid/10", B: "text-brand border-brand/30 bg-brand/10", C: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", D: "text-orange-400 border-orange-400/30 bg-orange-400/10", F: "text-red-400 border-red-500/30 bg-red-500/10" };

  return (
    <div className="min-h-screen bg-ink">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-28 pb-12 space-y-6">
        {/* Header */}
        <div className="text-center animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/15 border border-brand/20 mb-4">
            <Trophy size={28} className="text-brand" />
          </div>
          <h1 className="font-display text-3xl font-bold">Interview Complete!</h1>
          <p className="text-white/40 text-sm mt-1">{session?.role} • {session?.difficulty} difficulty</p>
        </div>

        {/* Score + radar */}
        <div className="grid md:grid-cols-2 gap-6 animate-fade-up opacity-0 animate-delay-100" style={{ animationFillMode: "forwards" }}>
          <div className="glass rounded-3xl p-6 text-center">
            <p className="text-sm text-white/40 mb-2">Overall Score</p>
            <p className={`font-display text-7xl font-bold ${scoreColor}`}>{overall}<span className="text-3xl text-white/30">%</span></p>
            <p className={`mt-3 text-sm font-medium px-4 py-1.5 rounded-full border inline-block ${ready ? "text-acid border-acid/30 bg-acid/10" : "text-white/50 border-white/10"}`}>
              {ready ? "✅ Ready for interviews!" : "🔧 Keep practicing"}
            </p>
            {feedback?.summary && <p className="text-sm text-white/50 mt-4 leading-relaxed">{feedback.summary}</p>}
          </div>

          {radarData.length > 0 && (
            <div className="glass rounded-3xl p-6">
              <p className="text-sm text-white/40 mb-3">Performance Radar</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                  <Radar dataKey="A" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Score bars */}
        {feedback && (
          <div className="glass rounded-2xl p-6 space-y-4 animate-fade-up opacity-0 animate-delay-200" style={{ animationFillMode: "forwards" }}>
            <h3 className="font-display font-semibold">Score Breakdown</h3>
            <ScoreBar label="Communication" value={feedback.communicationScore} color="brand" />
            <ScoreBar label="Technical"     value={feedback.technicalScore}     color="sky" />
            <ScoreBar label="Confidence"    value={feedback.confidenceScore}    color="acid" />
          </div>
        )}

        {/* Strengths + Improve */}
        {feedback && (
          <div className="grid md:grid-cols-2 gap-5 animate-fade-up opacity-0 animate-delay-200" style={{ animationFillMode: "forwards" }}>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} className="text-acid" /><h3 className="font-display font-semibold">Top Strengths</h3></div>
              <ul className="space-y-2">
                {feedback.topStrengths?.map((s, i) => <li key={i} className="text-sm text-white/60 flex gap-2"><span className="text-acid">✓</span>{s}</li>)}
              </ul>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4"><Target size={15} className="text-rose-400" /><h3 className="font-display font-semibold">Areas to Improve</h3></div>
              <ul className="space-y-2">
                {feedback.areasToImprove?.map((a, i) => <li key={i} className="text-sm text-white/60 flex gap-2"><span className="text-rose-400">→</span>{a}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Recommended topics */}
        {feedback?.recommendedTopics?.length > 0 && (
          <div className="glass rounded-2xl p-5 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center gap-2 mb-4"><BookOpen size={15} className="text-brand" /><h3 className="font-display font-semibold">Study These Next</h3></div>
            <div className="flex flex-wrap gap-2">
              {feedback.recommendedTopics.map((t, i) => (
                <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-brand/10 text-brand border border-brand/20">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Q&A review */}
        {questions.length > 0 && (
          <div className="space-y-3 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
            <h3 className="font-display font-semibold text-lg">Answer Review</h3>
            {questions.map((q, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden">
                <button onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-start gap-4 p-5 text-left hover:bg-white/3 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {q.score !== null
                      ? <span className={`text-sm font-mono font-bold px-2.5 py-1 rounded-lg border ${gradeColor[q.score >= 8 ? "A" : q.score >= 6 ? "B" : q.score >= 4 ? "C" : "D"] || gradeColor.C}`}>{q.score}/10</span>
                      : <span className="text-xs text-white/30 border border-white/10 px-2 py-1 rounded-lg">skip</span>
                    }
                  </div>
                  <p className="flex-1 text-sm font-medium leading-relaxed">{q.questionText}</p>
                  {expanded === i ? <ChevronUp size={16} className="text-white/30 flex-shrink-0 mt-0.5" /> : <ChevronDown size={16} className="text-white/30 flex-shrink-0 mt-0.5" />}
                </button>
                {expanded === i && (
                  <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                    {q.answer && <div className="bg-white/5 rounded-xl p-3"><p className="text-xs text-white/40 mb-1">Your Answer</p><p className="text-sm text-white/70">{q.answer}</p></div>}
                    {q.feedback && <div className="bg-brand/5 border border-brand/15 rounded-xl p-3"><p className="text-xs text-brand mb-1">Feedback</p><p className="text-sm text-white/70">{q.feedback}</p></div>}
                    {q.betterAnswer && <div className="bg-acid/5 border border-acid/15 rounded-xl p-3"><p className="text-xs text-acid mb-1">Model Answer</p><p className="text-sm text-white/70">{q.betterAnswer}</p></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-4 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <Link to="/interview/start"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-brand-gradient text-white font-display font-semibold rounded-2xl hover:opacity-90 transition-opacity">
            <RotateCcw size={16} /> Try Again
          </Link>
          <Link to="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 glass border border-white/10 font-display font-semibold rounded-2xl hover:border-white/20 transition-all">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
