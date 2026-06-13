import { Link } from "react-router-dom";
import { Zap, Target, Brain, ChevronRight, Star, Shield, Mic } from "lucide-react";

const FEATURES = [
  { icon: Brain, title: "AI Resume Analyzer", desc: "Get ATS score, skill gaps, and bullet-point rewrites in seconds.", color: "brand" },
  { icon: Mic,   title: "Mock Interviews",    desc: "AI-powered questions tailored to your resume and target role.", color: "acid" },
  { icon: Target, title: "Score & Improve",  desc: "6-dimension answer scoring with instant feedback and model answers.", color: "rose" },
  { icon: Shield, title: "Track Progress",   desc: "Dashboard with weekly trends, skill radar, and readiness verdict.", color: "sky" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink noise relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
      {/* Brand glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display font-bold text-xl">
          <span className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </span>
          Hire<span className="text-brand">Lens</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"    className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">Login</Link>
          <Link to="/register" className="text-sm font-medium bg-brand-gradient text-white px-5 py-2 rounded-xl hover:opacity-90 transition-opacity">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand/30 bg-brand/10 text-brand text-sm font-medium mb-8 animate-fade-in">
          <Star size={13} className="fill-brand" />
          AI-powered interview prep for students & freshers
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] mb-6 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
          Stop Guessing.<br />
          Start <span className="text-transparent bg-clip-text bg-brand-gradient">Acing</span>.
        </h1>

        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 animate-fade-up opacity-0 animate-delay-100" style={{ animationFillMode: "forwards" }}>
          HireLens analyzes your resume, generates role-specific questions, scores your answers, and tells you exactly what to improve — all powered by AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up opacity-0 animate-delay-200" style={{ animationFillMode: "forwards" }}>
          <Link to="/register"
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-acid text-ink font-display font-bold text-base rounded-2xl hover:bg-acid-dark transition-colors glow-acid">
            Start for Free
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 glass border border-white/10 text-white font-medium text-base rounded-2xl hover:border-brand/30 transition-all">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color }, i) => {
            const clr = { brand: "text-brand bg-brand/10 border-brand/20", acid: "text-acid bg-acid/10 border-acid/20", rose: "text-rose-400 bg-rose-400/10 border-rose-400/20", sky: "text-sky-400 bg-sky-400/10 border-sky-400/20" }[color];
            return (
              <div key={i} className="glass rounded-2xl p-6 hover:border-white/20 transition-all hover:-translate-y-1 animate-fade-up opacity-0"
                style={{ animationDelay: `${300 + i * 100}ms`, animationFillMode: "forwards" }}>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${clr}`}>
                  <Icon size={18} />
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
