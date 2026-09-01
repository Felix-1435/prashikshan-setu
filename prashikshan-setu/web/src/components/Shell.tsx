import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileUp, BarChart3, LogOut, Menu, X, Sun, Moon,
  Home, Route, MessageCircle, ClipboardList, Shield, BookOpen,
} from "lucide-react";
import { clearUser, type User } from "../lib/auth";
import { cn } from "../lib/utils";

const traineeNav = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/path", label: "Learning path", icon: Route },
  { href: "/coach", label: "AI coach", icon: MessageCircle },
  { href: "/quizzes", label: "Quizzes", icon: ClipboardList },
];

const coordNav = [
  { href: "/generate", label: "Build quiz", icon: FileUp },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/quizzes", label: "Quizzes", icon: ClipboardList },
  { href: "/coach", label: "AI coach", icon: MessageCircle },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/quizzes", label: "Quizzes", icon: ClipboardList },
  { href: "/generate", label: "Build quiz", icon: FileUp },
];

export default function Shell({
  user,
  onLogout,
  children,
}: {
  user: User;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ps-theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ps-theme", next ? "dark" : "light");
  };

  const nav =
    user.role === "admin" ? adminNav : user.role === "coordinator" ? coordNav : traineeNav;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 md:translate-x-0 md:static",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          background: "linear-gradient(180deg, #071628 0%, #0b1f3a 55%, #0d2a28 100%)",
        }}
      >
        <div className="tricolor-bar shrink-0" />
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <div>
            <div className="font-display text-xl text-white">
              Prashikshan<span className="text-orange-300">Setu</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">MoSPI · iGOT bridge</div>
          </div>
          <button className="md:hidden p-2 text-white" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = loc === item.href || (item.href !== "/app" && loc.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition min-h-[44px]",
                    active
                      ? "nav-item-active text-white font-medium"
                      : "text-white/65 hover:bg-white/10 hover:text-white",
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
            className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs bg-white/10 hover:bg-white/15 text-white transition"
          >
            <span>{dark ? "Switch to light" : "Switch to dark"}</span>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-orange-300" />
              {user.name}
            </div>
            <div className="text-xs text-white/45 truncate mt-0.5">
              {user.designation || user.role} · {user.department || "MoSPI"}
            </div>
          </div>
          <button
            className="flex items-center gap-2 text-xs text-white/55 hover:text-white transition"
            onClick={() => {
              clearUser();
              onLogout();
            }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 z-30 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="tricolor-bar sticky top-0 z-30" />
        <header
          className="h-14 border-b flex items-center px-4 gap-3 sticky top-[3px] z-20"
          style={{
            borderColor: "var(--border)",
            background: "color-mix(in srgb, var(--surface) 82%, transparent)",
            backdropFilter: "blur(12px)",
            color: "var(--text)",
          }}
        >
          <button
            className="md:hidden p-2 rounded-lg border"
            style={{ borderColor: "var(--border)" }}
            onClick={() => setOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm muted truncate">
            AI training bridge · Official Statistical System · iGOT Karmayogi
          </div>
          <span
            className="ml-auto pill shrink-0"
            style={{
              background: "color-mix(in srgb, var(--accent) 18%, transparent)",
              color: "var(--accent)",
            }}
          >
            PS SIH26101
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto animate-fade-up safe-pb">{children}</main>
      </div>
    </div>
  );
}
