import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { Upload, FileText, CheckCircle, X, Loader, Briefcase } from "lucide-react";

export default function UploadResume() {
  const navigate           = useNavigate();
  const inputRef           = useRef();
  const [file, setFile]    = useState(null);
  const [jd, setJd]        = useState("");
  const [drag, setDrag]    = useState(false);
  const [step, setStep]    = useState("idle"); // idle | uploading | analyzing | done

  const handleFile = (f) => {
    if (!f) return;
    if (!["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(f.type)) {
      toast.error("Only PDF or DOCX files allowed"); return;
    }
    if (f.size > 5 * 1024 * 1024) { toast.error("Max file size is 5MB"); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) { toast.error("Please select a file first"); return; }
    setStep("uploading");
    try {
      const form = new FormData();
      form.append("resume", file);
      const { data: up } = await api.post("/resume/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const resumeId = up.data.resumeId;
      toast.success("Resume uploaded!");

      setStep("analyzing");
      await api.post(`/resume/analyze/${resumeId}`, { jobDescription: jd });
      toast.success("Analysis complete!");

      setStep("done");
      setTimeout(() => navigate(`/resume/analysis/${resumeId}`), 800);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
      setStep("idle");
    }
  };

  const stepLabel = { idle: null, uploading: "Uploading file…", analyzing: "AI is analyzing your resume…", done: "Done! Redirecting…" };

  return (
    <div className="min-h-screen bg-ink">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
      <Navbar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-12">
        <div className="mb-8 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <h1 className="font-display text-3xl font-bold">Upload Your Resume</h1>
          <p className="text-white/40 text-sm mt-1">PDF or DOCX • Max 5MB • AI analysis in seconds</p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => !file && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          className={`relative rounded-3xl border-2 border-dashed transition-all cursor-pointer mb-6 animate-fade-up opacity-0 animate-delay-100
            ${file ? "border-acid/40 bg-acid/5 cursor-default" : drag ? "border-brand bg-brand/10" : "border-white/15 bg-white/3 hover:border-brand/40 hover:bg-brand/5"}`}
          style={{ animationFillMode: "forwards" }}>

          <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />

          <div className="p-12 flex flex-col items-center text-center">
            {file ? (
              <>
                <CheckCircle size={40} className="text-acid mb-3" />
                <p className="font-display font-semibold">{file.name}</p>
                <p className="text-xs text-white/40 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-3 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                  <X size={12} /> Remove
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-4">
                  <Upload size={28} className="text-brand" />
                </div>
                <p className="font-display font-semibold text-lg">Drop your resume here</p>
                <p className="text-sm text-white/40 mt-1">or <span className="text-brand">browse files</span></p>
                <p className="text-xs text-white/25 mt-3">PDF or DOCX • Max 5MB</p>
              </>
            )}
          </div>
        </div>

        {/* Job description */}
        <div className="glass rounded-2xl p-5 mb-6 animate-fade-up opacity-0 animate-delay-200" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={15} className="text-brand" />
            <p className="font-display font-semibold text-sm">Job Description <span className="text-white/30 font-normal">(optional)</span></p>
          </div>
          <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4}
            placeholder="Paste the job description here to get a match score and targeted skill gap analysis…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-white/20 focus:border-brand/40 resize-none" />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!file || step !== "idle"}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-display font-bold text-base transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            bg-brand-gradient text-white hover:opacity-90 glow-brand animate-fade-up opacity-0 animate-delay-300"
          style={{ animationFillMode: "forwards" }}>
          {step !== "idle" ? (
            <><Loader size={18} className="animate-spin" /> {stepLabel[step]}</>
          ) : (
            <><FileText size={18} /> Analyze My Resume</>
          )}
        </button>
      </main>
    </div>
  );
}
