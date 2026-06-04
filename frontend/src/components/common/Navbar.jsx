import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { LayoutDashboard, FileText, Mic, LogOut, Zap } from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/dashboard",      label: "Dashboard",  icon: LayoutDashboard },
  { to: "/resume/upload",  label: "Resume",     icon: FileText },
  { to: "/interview/start",label: "Interview",  icon: Mic },
  { to: "/advanced",       label: "Advanced",   icon: Zap },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname }     = useLocation();
  const [open, setOpen]  = useState(false);

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold text-xl">
          <span className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </span>
          <span>Hire<span className="text-brand">Lens</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${pathname.startsWith(to)
                  ? "bg-brand/20 text-brand border border-brand/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"}`}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-white/50">
            Hi, <span className="text-white font-medium">{user.name?.split(" ")[0]}</span>
          </span>
          <button onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all">
            <LogOut size={15} />
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}