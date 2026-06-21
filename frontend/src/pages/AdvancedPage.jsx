import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";
import {
  MessageSquare, TrendingUp, GitCompare, ShieldAlert,
  ChevronRight, Sparkles,
} from "lucide-react";

const TOOLS = [
  {
    to:    "/advanced/followup",
    icon:  MessageSquare,
    color: "brand",
    title: "Follow-Up Generator",
    desc:  "After answering a question, get 3 AI-crafted follow-ups that probe deeper — exactly what a real interviewer would ask next.",
    tags:  ["Practice", "Drill-Down", "Interview Prep"],
    badge: "Most Used",
  },
  {
    to:    "/advanced/confidence",
    icon:  TrendingUp,
    color: "sky",
    title: "Confidence Scorer",
    desc:  "Paste any answer and get a 5-dimension confidence analysis — assertiveness, clarity, specificity, structure, and vocabulary.",
    tags:  ["Communication", "Language", "Self-Awareness"],
    badge: null,
  },
  {
    to:    "/advanced/compare",
    icon:  GitCompare,
    color: "acid",
    title: "Resume Comparator",
    desc:  "Uploaded multiple resume versions? Compare them side-by-side and find out which one a recruiter would actually pick.",
    tags:  ["Resume", "Side-by-Side", "AI Verdict"],
    badge: "New",
  },
  {
    to:    "/advanced/rejection",
    icon:  ShieldAlert,
    color: "rose",
    title: "Rejection Simulator",
    desc:  "Get brutally honest feedback on why your resume might get rejected — from both ATS filters and human recruiters.",
    tags:  ["ATS", "Recruiter", "Red Flags"],
    badge: "Brutal Mode",
  },
];

const COLOR = {
  brand: { bg: "bg-brand/10", border: "border-brand/25", text: "text-brand", hover: "hover:border-brand/50", tag: "bg-brand/10 text-brand border-brand/20" },
  sky:   { bg: "bg-sky-400/10", border: "border-sky-400/25", text: "text-sky-400", hover: "hover:border-sky-400/50", tag: "bg-sky-400/10 text-sky-400 border-sky-400/20" },
  acid:  { bg: "bg-acid/10", border: "border-acid/25", text: "text-acid", hover: "hover:border-acid/50", tag: "bg-acid/10 text-acid border-acid/20" },
  rose:  { bg: "bg-rose-400/10", border: "border-rose-400/25", text: "text-rose-400", hover: "hover:border-rose-400/50", tag: "bg-rose-400/10 text-rose-400 border-rose-400/20" },
};

export default function AdvancedPage() {
  return (
    <div className="min-h-screen bg-ink relative">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-brand/6 rounded-full blur-[130px] pointer-events-none z-0" />
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-28 pb-16">
        {/* Header */}
        <div className="mb-10 animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/30 bg-brand/10 text-brand text-xs font-mono mb-4">
            <Sparkles size={12} /> Advanced AI Tools
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-3">
            Go Beyond the Basics
          </h1>
          <p className="text-white/40 text-base max-w-xl leading-relaxed">
            Four specialized AI tools to help you understand your weak spots, fix your resume, and walk into interviews with full confidence.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid sm:grid-cols-2 gap-5">
          {TOOLS.map(({ to, icon: Icon, color, title, desc, tags, badge }, i) => {
            const c = COLOR[color];
            return (
              <Link key={to} to={to}
                className={`group glass rounded-2xl p-6 border ${c.border} ${c.hover} transition-all duration-200 hover:-translate-y-1 hover:shadow-lg animate-fade-up opacity-0`}
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "forwards" }}>

                {/* Icon + badge row */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                    <Icon size={22} className={c.text} />
                  </div>
                  {badge && (
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-mono ${c.tag}`}>
                      {badge}
                    </span>
                  )}
                </div>

                {/* Title + desc */}
                <h2 className="font-display font-bold text-lg mb-2">{title}</h2>
                <p className="text-sm text-white/50 leading-relaxed mb-5">{desc}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {tags.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-white/35 border border-white/8">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA row */}
                <div className={`flex items-center gap-2 text-sm font-display font-semibold ${c.text}`}>
                  Open Tool
                  <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}