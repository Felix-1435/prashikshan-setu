import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import { saveUser, type User } from "../lib/auth";
import { Sparkles, Shield, Route, FileText } from "lucide-react";

export default function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [username, setUsername] = useState("trainee01");
  const [password, setPassword] = useState("Train@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const u = await api<User>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      saveUser(u);
      onLogin(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="login-panel relative flex-1 p-10 md:p-14 flex flex-col justify-between min-h-[42vh] lg:min-h-screen">
        <div className="absolute w-72 h-72 rounded-full bg-orange-400/20 blur-3xl -top-10 -left-10 orb" />
        <div className="absolute w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl bottom-10 right-0 orb" style={{ animationDelay: "2s" }} />
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">SIH 2026 · SIH26101 · MoSPI</div>
            <h1 className="font-display text-4xl md:text-5xl text-white">PrashikshanSetu</h1>
            <p className="mt-3 text-white/75 text-sm md:text-base max-w-md leading-relaxed">
              AI training bridge for the Official Statistical System — competency gaps, iGOT Karmayogi pathways,
              and assessments from real training material.
            </p>
          </motion.div>
        </div>
        <motion.ul
          className="relative z-10 space-y-4 mt-10"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          {[
            { icon: Shield, t: "Competency map across Statistical, Technical, Digital & Behavioural domains" },
            { icon: Route, t: "Personalized iGOT / NSSTA learning recommendations" },
            { icon: FileText, t: "Generate unique MCQs from uploaded notes in seconds" },
          ].map((item) => (
            <motion.li
              key={item.t}
              variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
              className="flex gap-3 text-sm text-white/90"
            >
              <item.icon className="w-5 h-5 text-orange-300 shrink-0 mt-0.5 floaty" />
              <span>{item.t}</span>
            </motion.li>
          ))}
        </motion.ul>
        <div className="relative z-10 text-xs text-white/40 mt-8">Ministry of Statistics and Programme Implementation</div>
      </div>

      <div className="flex-1 grid place-items-center p-6 md:p-10" style={{ background: "var(--bg)" }}>
        <motion.form
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={submit}
          className="card-glass w-full max-w-md p-8 space-y-5"
        >
          <div>
            <h2 className="font-display text-2xl heading">Sign in</h2>
            <p className="text-sm muted mt-1">Trainee, coordinator, or admin access</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold muted">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold muted">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
          <button type="submit" className="btn-primary w-full pulse-ring" disabled={loading}>
            {loading ? "Signing in…" : "Continue"}
          </button>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              ["trainee01", "Train@123", "Trainee"],
              ["coord01", "Coord@123", "Coord"],
              ["admin", "Admin@123", "Admin"],
            ].map(([u, p, label]) => (
              <button
                key={u}
                type="button"
                className="btn-ghost text-[11px] py-2"
                onClick={() => fill(u, p)}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.form>
      </div>
    </div>
  );
}
