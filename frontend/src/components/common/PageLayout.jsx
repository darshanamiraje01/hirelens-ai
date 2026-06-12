// Shared layout wrapper — handles the bg, grid, navbar spacing, and max-width
// Use this in every page so spacing and background are always consistent
import Navbar from "./Navbar.jsx";

export default function PageLayout({ children, maxWidth = "max-w-7xl", className = "" }) {
  return (
    <div className="min-h-screen bg-ink relative">
      {/* Background grid — visible on all pages */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none z-0" />
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand/6 rounded-full blur-[130px] pointer-events-none z-0" />

      <Navbar />

      <main className={`relative z-10 ${maxWidth} mx-auto px-4 sm:px-6 pt-24 pb-16 ${className}`}>
        {children}
      </main>
    </div>
  );
}
