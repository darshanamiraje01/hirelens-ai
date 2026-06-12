export default function StatCard({ label, value, sub, icon: Icon, color = "brand", delay = 0 }) {
  const colors = {
    brand: "from-brand/20 to-brand/5 border-brand/20 text-brand",
    acid:  "from-acid/20 to-acid/5 border-acid/20 text-acid",
    rose:  "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400",
    sky:   "from-sky-500/20 to-sky-500/5 border-sky-500/20 text-sky-400",
  };
  return (
    <div className={`glass rounded-2xl p-5 bg-gradient-to-br border animate-fade-up opacity-0`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} border flex items-center justify-center mb-3`}>
        {Icon && <Icon size={18} className={colors[color].split(" ").pop()} />}
      </div>
      <p className="text-3xl font-display font-bold">{value ?? "—"}</p>
      <p className="text-sm text-white/60 mt-1">{label}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}
