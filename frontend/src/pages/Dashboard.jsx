import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PageLayout from "../components/common/PageLayout.jsx";
import StatCard   from "../components/common/StatCard.jsx";
import api from "../api/axios.js";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  FileText, Mic, TrendingUp, Target, ChevronRight, Plus,
  Clock, Zap, BookOpen, AlertTriangle, CheckCircle,
} from "lucide-react";

// ── Custom tooltip for charts ─────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass border border-white/15 rounded-xl px-3 py-2 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono font-semibold">{p.name}: {p.value}%</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [overview,  setOverview]  = useState(null);
  const [ats,       setAts]       = useState(null);
  const [perf,      setPerf]      = useState(null);
  const [progress,  setProgress]  = useState(null);
  const [skills,    setSkills]    = useState(null);
  const [resumes,   setResumes]   = useState([]);
  const [sessions,  setSessions]  = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/dashboard/overview"),
      api.get("/dashboard/ats"),
      api.get("/dashboard/performance"),
      api.get("/dashboard/progress"),
      api.get("/dashboard/skills"),
      api.get("/resume"),
      api.get("/interview/sessions"),
    ]).then(([ov, at, pf, pr, sk, rv, sv]) => {
      if (ov.status === "fulfilled") setOverview(ov.value.data.data);
      if (at.status === "fulfilled") setAts(at.value.data.data);
      if (pf.status === "fulfilled") setPerf(pf.value.data.data);
      if (pr.status === "fulfilled") setProgress(pr.value.data.data);
      if (sk.status === "fulfilled") setSkills(sk.value.data.data);
      if (rv.status === "fulfilled") setResumes(rv.value.data.data.resumes?.slice(0, 4) || []);
      if (sv.status === "fulfilled") setSessions(sv.value.data.data.sessions?.slice(0, 4) || []);
    }).finally(() => setLoadingAll(false));
  }, []);

  // Radar data from performance breakdown
  const radarData = perf ? [
    { subject: "Technical",     A: Math.round((perf.avgScores.technical || 0)) },
    { subject: "Communication", A: Math.round((perf.avgScores.communication || 0)) },
    { subject: "Confidence",    A: Math.round((perf.avgScores.confidence || 0)) },
    { subject: "Overall",       A: Math.round((perf.avgScores.overall || 0)) },
    { subject: "HR",            A: Math.round((perf.categoryBreakdown?.hr || 0) * 10) },
    { subject: "Behavioral",    A: Math.round((perf.categoryBreakdown?.behavioral || 0) * 10) },
  ] : [];

  // Weekly trend line chart
  const weeklyData = progress?.weeklyTrend?.map(w => ({
    week:  w.week?.slice(5) || "",  // "06-09" format
    Score: w.avgScore,
  })) || [];

  const ready = overview?.scores?.readyForInterview;

  return (
    <PageLayout>
      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="mb-8 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Good day, <span className="text-brand">{user?.name?.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-white/40 text-sm mt-1">Your interview readiness at a glance</p>
          </div>
          {/* Readiness badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium
            ${ready ? "bg-acid/10 border-acid/30 text-acid" : "bg-white/5 border-white/10 text-white/50"}`}>
            {ready ? <><CheckCircle size={15} /> Ready to Interview!</> : <><Zap size={15} /> Keep Practicing</>}
          </div>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Resumes Uploaded"  value={overview?.resumes?.total ?? "—"}                                         icon={FileText}   color="brand" delay={0}   />
        <StatCard label="Interviews Done"   value={overview?.interviews?.completed ?? "—"}                                   icon={Mic}        color="acid"  delay={100} />
        <StatCard label="Avg ATS Score"     value={overview?.scores?.avgAtsScore ? `${overview.scores.avgAtsScore}%` : "—"} icon={Target}     color="sky"   delay={200} />
        <StatCard label="Interview Score"   value={overview?.scores?.avgInterviewScore ? `${overview.scores.avgInterviewScore}%` : "—"} icon={TrendingUp} color="rose" delay={300} />
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8 animate-fade-up opacity-0 animate-delay-200" style={{ animationFillMode: "forwards" }}>
        {[
          { to: "/resume/upload",   icon: FileText, label: "Upload & Analyze Resume",  desc: "Get ATS score + AI feedback",         color: "brand", glow: "glow-brand", bg: "bg-brand-gradient" },
          { to: "/interview/start", icon: Mic,      label: "Start Mock Interview",      desc: "AI questions tailored to your role",  color: "acid",  glow: "glow-acid",  bg: "bg-acid text-ink" },
        ].map(({ to, icon: Icon, label, desc, glow, bg }) => (
          <Link key={to} to={to}
            className={`group flex items-center gap-4 p-5 rounded-2xl ${bg} hover:opacity-90 transition-all ${glow}`}>
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold">{label}</p>
              <p className="text-sm opacity-70 mt-0.5">{desc}</p>
            </div>
            <ChevronRight size={18} className="opacity-50 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly progress chart */}
        <div className="glass rounded-2xl p-6 animate-fade-up opacity-0 animate-delay-200" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold">Score Progress</h2>
            {progress?.improvementScore !== null && progress?.improvementScore !== undefined && (
              <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border
                ${progress.improvementScore >= 0 ? "text-acid border-acid/30 bg-acid/10" : "text-red-400 border-red-400/30 bg-red-400/10"}`}>
                {progress.improvementScore >= 0 ? "+" : ""}{progress.improvementScore}pts
              </span>
            )}
          </div>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="Score" stroke="#6C63FF" strokeWidth={2.5} dot={{ fill: "#6C63FF", r: 4 }} activeDot={{ r: 6, fill: "#C8FF00" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-white/20">
              <TrendingUp size={32} className="mb-2" />
              <p className="text-sm">Complete interviews to see your trend</p>
            </div>
          )}
        </div>

        {/* Performance radar */}
        <div className="glass rounded-2xl p-6 animate-fade-up opacity-0 animate-delay-300" style={{ animationFillMode: "forwards" }}>
          <h2 className="font-display font-semibold mb-5">Performance Radar</h2>
          {radarData.some(d => d.A > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} />
                <Radar dataKey="A" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 8, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-white/20">
              <Target size={32} className="mb-2" />
              <p className="text-sm">Complete interviews to see radar</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Skill gap + recommendations ───────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Skill gap */}
        <div className="glass rounded-2xl p-6 animate-fade-up opacity-0 animate-delay-300" style={{ animationFillMode: "forwards" }}>
          <h2 className="font-display font-semibold mb-4">Skill Gap</h2>
          {skills?.skillsGap?.length > 0 ? (
            <>
              <p className="text-xs text-white/40 mb-3">Missing from your resume — learn these</p>
              <div className="flex flex-wrap gap-2">
                {skills.skillsGap.slice(0, 8).map(({ skill }) => (
                  <span key={skill} className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{skill}</span>
                ))}
              </div>
              {skills.skillsFound?.length > 0 && (
                <>
                  <p className="text-xs text-white/40 mt-4 mb-3">Skills you already have</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.skillsFound.slice(0, 6).map(({ skill }) => (
                      <span key={skill} className="text-xs px-3 py-1.5 rounded-full bg-acid/10 text-acid border border-acid/20">{skill}</span>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-white/20">
              <AlertTriangle size={28} className="mb-2" />
              <p className="text-sm">Analyze a resume to see skill gaps</p>
              <Link to="/resume/upload" className="text-xs text-brand mt-2 hover:underline">Upload Resume →</Link>
            </div>
          )}
        </div>

        {/* Study recommendations */}
        <div className="glass rounded-2xl p-6 animate-fade-up opacity-0 animate-delay-400" style={{ animationFillMode: "forwards" }}>
          <h2 className="font-display font-semibold mb-4">Study Recommendations</h2>
          {progress?.recommendedTopics?.length > 0 ? (
            <div className="space-y-2.5">
              {progress.recommendedTopics.slice(0, 6).map(({ topic, frequency }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-md bg-brand/15 text-brand text-xs flex items-center justify-center font-mono flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-white/70 flex-1">{topic}</span>
                  <span className="text-xs text-white/30 font-mono">×{frequency}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-white/20">
              <BookOpen size={28} className="mb-2" />
              <p className="text-sm">Complete interviews to get recommendations</p>
              <Link to="/interview/start" className="text-xs text-acid mt-2 hover:underline">Start Interview →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent activity ───────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent resumes */}
        <div className="animate-fade-up opacity-0 animate-delay-300" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Recent Resumes</h2>
            <Link to="/resume/upload" className="text-xs text-brand hover:text-brand-light transition-colors flex items-center gap-1">
              <Plus size={12} /> Upload
            </Link>
          </div>
          {resumes.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border border-dashed border-white/10">
              <FileText size={28} className="text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/30">No resumes uploaded yet</p>
              <Link to="/resume/upload" className="text-xs text-brand mt-2 inline-block hover:underline">Upload your first →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {resumes.map((r) => (
                <Link key={r._id} to={`/resume/analysis/${r._id}`}
                  className="glass rounded-xl p-4 flex items-center gap-3 hover:border-white/20 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-brand/15 border border-brand/20 flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.fileName}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {r.isAnalyzed
                        ? <span className="text-acid">✓ Analyzed</span>
                        : <span className="text-white/30">Not analyzed yet</span>}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent interviews */}
        <div className="animate-fade-up opacity-0 animate-delay-400" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Recent Interviews</h2>
            <Link to="/interview/start" className="text-xs text-acid hover:text-acid-dark transition-colors flex items-center gap-1">
              <Plus size={12} /> New
            </Link>
          </div>
          {sessions.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border border-dashed border-white/10">
              <Mic size={28} className="text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/30">No interviews yet</p>
              <Link to="/interview/start" className="text-xs text-acid mt-2 inline-block hover:underline">Start one now →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <Link key={s._id} to={`/interview/results/${s._id}`}
                  className="glass rounded-xl p-4 flex items-center gap-3 hover:border-white/20 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-acid/15 border border-acid/20 flex items-center justify-center flex-shrink-0">
                    <Mic size={15} className="text-acid" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.role}</p>
                    <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {s.status === "completed" ? `Score: ${s.totalScore}%` : "In progress"}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0
                    ${s.status === "completed" ? "text-acid border-acid/30 bg-acid/10" : "text-white/40 border-white/10"}`}>
                    {s.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
