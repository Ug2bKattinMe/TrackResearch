import { Link, Outlet } from "react-router-dom";
import TrackingBadge from "@/components/TrackingBadge";
import { ShieldCheck } from "lucide-react";

export default function ParticipantLayout() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="font-heading font-semibold text-primary text-[15px] tracking-tight">ResearchTrack</div>
              <div className="text-[10px] text-slate-500 tracking-wide uppercase mt-0.5">Anonymous Data Collection</div>
            </div>
          </Link>
          <nav className="flex items-center gap-5 sm:gap-6">
            <Link to="/" className="text-sm text-slate-600 hover:text-primary transition-colors">Studies</Link>
            <Link to="/my-submissions" className="text-sm text-slate-600 hover:text-primary transition-colors">My Submissions</Link>
            <Link to="/admin" className="text-sm text-slate-400 hover:text-primary transition-colors hidden sm:block">Researcher Portal</Link>
            <TrackingBadge />
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-slate-400">
          Your identity is never collected. Submissions are linked only by your anonymous tracking number.
        </div>
      </footer>
    </div>
  );
}