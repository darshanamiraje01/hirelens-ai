import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import {
  ShieldAlert, ArrowLeft, Loader as LoaderIcon,
  AlertTriangle, XCircle, CheckCircle, Lightbulb,
  Mail, FileText, Wrench,
} from "lucide-react";

const SEV_STYLE = {
  high:   "text-red-400 border-red-500/30 bg-red-500/8",
  medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/8",
  low:    "text-white/50 border-white/15 bg-white/3",
};

export default function RejectionSimulatorPage() {
  const navigate = useNavigate();
  const [resumes,   setResumes]   = useState([]);
  const [resumeId,  setResumeId]  = useState("");
  const [jd,        setJd]        = useState("");
  const [role,      setRole]      = useState("Software Developer");
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    api.get("/resume").then(r => setResumes(r.data.data.resumes || [])).catch(() => {});
  }, []);

  const simulate = async () => {
    if (!resumeId) { toast.error("Select a resume first"); return; }
    setLoading(true); setResult(null); setShowEmail(false);
    try {
      const { data } = await api.post("/advanced/rejection", {
        resumeId,
        jobDescription: jd,
        role,
      });
      setResult(data.data);
      toast.success("Simulation complete");
    } catch (err) {
      toast.error(err.response?.data?.message || "Simulation failed");
    } finally { setLoading(false); }
  };

  const prob    = result?.rejectionProbability ?? 0;
  const probClr = prob >= 70 ? "text-red-400" : prob >= 40 ? "text-yellow-400" : "text-acid";
  const probBg  = prob >= 70 ? "from-red-500/20 to-red-500/5 border-red-500/30"
                : prob >= 40 ? "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30"
                :              "from-acid/20 to-acid/5 border-acid/30";

  return (
    <div className="min-h-screen bg-ink relative">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-500/4 rounded-full blur-[120px] pointer-events-none z-0" />
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
              <ShieldAlert size={22} className="text-red-400" />
              Rejection Simulator
            </h1>
            <p className="text-white/40 text-sm mt-0.5">Find out exactly why your resume might get rejected before it does</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="glass rounded-2xl p-6 mb-6 space-y-4 animate-fade-up opacity-0 animate-delay-100"
          style={{ animationFillMode: "forwards" }}>
          <p className="text-xs text-white/40 uppercase tracking-wider font-mono">Simulation Setup</p>

          {/* Resume picker */}
          <div>
            <label className="text-xs text-white/50 block mb-1.5">Select Resume</label>
            {resumes.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl p-4 text-center">
                <FileText size={20} className="text-white/20 mx-auto mb-1.5" />
                <p className="text-xs text-white/30">No resumes uploaded yet</p>
                <button onClick={() => navigate("/resume/upload")} className="text-xs text-brand mt-1 hover:underline">Upload one →</button>
              </div>
            ) : (
              <select value={resumeId} onChange={e => setResumeId(e.target.value)}
                className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400/40 transition-all text-white">
                <option value="">— Choose a resume —</option>
                {resumes.map(r => <option key={r._id} value={r._id}>{r.fileName}</option>)}
              </select>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="text-xs text-white/50 block mb-1.5">Target Role</label>
            <input value={role} onChange={e => setRole(e.target.value)}
              placeholder="e.g. Backend Developer, Product Manager…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400/40 placeholder:text-white/15 transition-all" />
          </div>

          {/* JD */}
          <div>
            <label className="text-xs text-white/50 block mb-1.5">
              Job Description <span className="text-white/25">(optional — improves accuracy)</span>
            </label>
            <textarea value={jd} onChange={e => setJd(e.target.value)} rows={3}
              placeholder="Paste the job description to get targeted rejection reasons…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400/40 placeholder:text-white/15 resize-none transition-all" />
          </div>

          <button onClick={simulate} disabled={loading || !resumeId}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-display font-bold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
            {loading ? <><LoaderIcon size={15} className="animate-spin" /> Simulating…</> : <><ShieldAlert size={15} /> Run Rejection Simulation</>}
          </button>
        </div>

        {loading && <Loader text="Recruiter AI is reviewing your resume…" />}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-5 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>

            {/* Rejection probability */}
            <div className={`rounded-2xl p-6 bg-gradient-to-br border text-center ${probBg}`}>
              <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-3">Rejection Probability</p>
              <p className={`font-display font-bold text-6xl ${probClr}`}>{prob}<span className="text-3xl">%</span></p>
              <p className="text-sm text-white/50 mt-2">
                {prob >= 70 ? "High risk — significant changes needed"
                 : prob >= 40 ? "Moderate risk — some fixes required"
                 : "Low risk — resume is competitive"}
              </p>
            </div>

            {/* ATS failures */}
            {result.atsFailures?.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle size={15} className="text-red-400" />
                  <h3 className="font-display font-semibold">ATS Filter Failures</h3>
                  <span className="ml-auto text-xs text-white/30 font-mono">{result.atsFailures.length} found</span>
                </div>
                <div className="space-y-3">
                  {result.atsFailures.map((f, i) => (
                    <div key={i} className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                      <p className="text-sm text-red-300 mb-1.5">{f.reason}</p>
                      <p className="text-xs text-white/50 flex gap-1.5"><Wrench size={11} className="flex-shrink-0 mt-0.5 text-acid" />{f.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recruiter failures */}
            {result.recruiterFailures?.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={15} className="text-yellow-400" />
                  <h3 className="font-display font-semibold">Human Recruiter Rejections</h3>
                  <span className="ml-auto text-xs text-white/30 font-mono">{result.recruiterFailures.length} found</span>
                </div>
                <div className="space-y-3">
                  {result.recruiterFailures.map((f, i) => (
                    <div key={i} className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-4">
                      <p className="text-sm text-yellow-200 mb-1.5">{f.reason}</p>
                      <p className="text-xs text-white/50 flex gap-1.5"><Wrench size={11} className="flex-shrink-0 mt-0.5 text-acid" />{f.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Red flags */}
            {result.redFlags?.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert size={15} className="text-rose-400" />
                  <h3 className="font-display font-semibold">Red Flags</h3>
                </div>
                <div className="space-y-2.5">
                  {result.redFlags.map((f, i) => (
                    <div key={i} className={`rounded-xl p-3 border ${SEV_STYLE[f.severity] || SEV_STYLE.low}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono capitalize px-2 py-0.5 rounded-md bg-black/20">{f.severity}</span>
                        <p className="text-sm font-medium">{f.flag}</p>
                      </div>
                      <p className="text-xs text-white/50">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing keywords */}
            {result.missingKeywords?.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-3">Missing Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((kw, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* What passes + priority fixes */}
            <div className="grid sm:grid-cols-2 gap-4">
              {result.passSection && (
                <div className="glass rounded-2xl p-5 border border-acid/15">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={13} className="text-acid" />
                    <p className="font-display font-semibold text-sm text-acid">What Survives Review</p>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{result.passSection}</p>
                </div>
              )}
              {result.priorityFixes?.length > 0 && (
                <div className="glass rounded-2xl p-5 border border-brand/15">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={13} className="text-brand" />
                    <p className="font-display font-semibold text-sm text-brand">Priority Fixes</p>
                  </div>
                  <ol className="space-y-1.5">
                    {result.priorityFixes.map((fix, i) => (
                      <li key={i} className="text-sm text-white/60 flex gap-2">
                        <span className="text-brand/60 flex-shrink-0 font-mono">{i + 1}.</span>{fix}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Rejection email simulation */}
            {result.rejectEmailSimulation && (
              <div className="glass rounded-2xl overflow-hidden border border-white/10">
                <button onClick={() => setShowEmail(e => !e)}
                  className="w-full flex items-center gap-3 p-5 hover:bg-white/3 transition-colors text-left">
                  <Mail size={16} className="text-white/40" />
                  <p className="font-display font-semibold text-sm flex-1">Simulated Rejection Email</p>
                  <span className="text-xs text-white/30 font-mono">{showEmail ? "hide" : "show"}</span>
                </button>
                {showEmail && (
                  <div className="border-t border-white/8 p-5 bg-red-500/3">
                    <p className="text-sm text-white/60 leading-relaxed font-mono whitespace-pre-line italic">
                      {result.rejectEmailSimulation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}