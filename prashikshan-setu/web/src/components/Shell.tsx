import { Link, useLocation } from "wouter";
import type { User } from "../lib/auth";
import { clearUser } from "../lib/auth";
import {
  LayoutDashboard, Route as RouteIcon, MessageSquare, ClipboardList,
  FileUp, BarChart3, LogOut, Menu, X, Sun, Moon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

const traineeNav = [
  { href: "/app", label: "Competency map", icon: LayoutDashboard },
  { href: "/path", label: "Learning path", icon: RouteIcon },
  { href: "/quizzes", label: "My assessments", icon: ClipboardList },
  { href: "/coach", label: "AI coach", icon: MessageSquare },
];
const coordNav = [
  { href: "/generate", label: "Build quiz", icon: FileUp },
  { href: "/quizzes", label: "Quiz bank", icon: ClipboardList },
  { href: "/admin", label: "Scores & overview", icon: BarChart3 },
];
const adminNav = [
  { href: "/admin", label: "Command overview", icon: BarChart3 },
  { href: "/generate", label: "Build quiz", icon: FileUp },
  { href: "/quizzes", label: "Quiz bank", icon: ClipboardList },
];

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("ps_theme");
    const prefer = saved === "dark";
    setDark(prefer);
    document.documentElement.classList.toggle("dark", prefer);
  }, []);
  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("ps_theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

export default function Shell({
  user, onLogout, children,
}: { user: User; onLogout: () => void; children: React.ReactNode }) {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const nav = user.role === "trainee" ? traineeNav : user.role === "admin" ? adminNav : coordNav;

  return (
    <div className="min-h-screen flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 md:translate-x-0 md:static",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "var(--sidebar)", color: "#eef3fb" }}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <div>
            <div className="font-display text-xl text-white">PrashikshanSetu</div>
            <div className="text-[10px] uppercase tracking-widest text-white/45">SIH26101 · MoSPI</div>
          </div>
          <button className="md:hidden p-2 text-white" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = loc === item.href || loc.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-white/15 text-white shadow-inner" : "text-white/65 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-3">
          <button
            onClick={toggle}
            className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs bg-white/10 hover:bg-white/15 text-white"
          >
            <span>{dark ? "Switch to light" : "Switch to dark"}</span>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div>
            <div className="text-sm font-semibold text-white">{user.name}</div>
            <div className="text-xs text-white/45 truncate">{user.designation || user.role} · {user.department || "MoSPI"}</div>
          </div>
          <button className="flex items-center gap-2 text-xs text-white/55 hover:text-white" onClick={() => { clearUser(); onLogout(); }}>
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 z-30 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-14 border-b flex items-center px-4 gap-3 sticky top-0 z-20"
          style={{
            borderColor: "var(--border)",
            background: "color-mix(in srgb, var(--surface) 78%, transparent)",
            backdropFilter: "blur(12px)",
            color: "var(--text)",
          }}
        >
          <button className="md:hidden p-2 rounded-lg border" style={{ borderColor: "var(--border)" }} onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm muted">AI training bridge · Official Statistical System · iGOT Karmayogi</div>
          <span className="ml-auto pill" style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" }}>
            PS SIH26101
          </span>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
