import { Link, useLocation } from "wouter";
import type { User } from "../lib/auth";
import { clearUser } from "../lib/auth";
import {
  LayoutDashboard,
  Route as RouteIcon,
  MessageSquare,
  ClipboardList,
  FileUp,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

const traineeNav = [
  { href: "/app", label: "Competency map", icon: LayoutDashboard },
  { href: "/path", label: "Learning path", icon: RouteIcon },
  { href: "/quizzes", label: "Assessments", icon: ClipboardList },
  { href: "/coach", label: "AI coach", icon: MessageSquare },
];

const coordNav = [
  { href: "/generate", label: "Build quiz", icon: FileUp },
  { href: "/quizzes", label: "Assessments", icon: ClipboardList },
  { href: "/admin", label: "Overview", icon: BarChart3 },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/generate", label: "Build quiz", icon: FileUp },
  { href: "/quizzes", label: "Assessments", icon: ClipboardList },
];

export default function Shell({
  user,
  onLogout,
  children,
}: {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const nav =
    user.role === "trainee" ? traineeNav : user.role === "admin" ? adminNav : coordNav;

  return (
    <div className="min-h-screen flex">
      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-ink text-white flex flex-col transition-transform md:translate-x-0 md:static",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <div>
            <div className="font-display text-xl tracking-tight">PrashikshanSetu</div>
            <div className="text-[10px] uppercase tracking-widest text-white/50">SIH26101 · MoSPI</div>
          </div>
          <button className="md:hidden p-2" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
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
                    active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm font-semibold">{user.name}</div>
          <div className="text-xs text-white/50 truncate">
            {user.designation || user.role} · {user.department || "MoSPI"}
          </div>
          <button
            className="mt-3 flex items-center gap-2 text-xs text-white/60 hover:text-white"
            onClick={() => {
              clearUser();
              onLogout();
            }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-line bg-white/70 backdrop-blur flex items-center px-4 gap-3 sticky top-0 z-20">
          <button className="md:hidden p-2 rounded-lg border border-line" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm text-ink-mute">
            Prashikshan bridge for the Official Statistical System
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
