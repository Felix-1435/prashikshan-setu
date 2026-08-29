import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import { saveUser, type User } from "../lib/auth";
import { ArrowRight, Sparkles, Shield, BookOpen, Bot } from "lucide-react";

function FloatingParticles() {
  const colors = ["#00CFFF", "#3B82F6", "#E86B12", "#22D3EE", "#A855F7"];
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        size: 3 + Math.random() * 5,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 5 + Math.random() * 7,
        delay: Math.random() * 3,
        drift: 20 + Math.random() * 40,
        color: colors[i % colors.length],
      })),
    [],
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{ y: [0, -p.drift, 0], opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [username, setUsername] = useState("trainee01");
  const [password, setPassword] = useState("Train@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const u = await api<User>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setOk(true);
      saveUser(u);
      setTimeout(() => onLogin(u), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  const demos = [
    { u: "trainee01", p: "Train@123", label: "Trainee · Anita" },
    { u: "trainee03", p: "Train@123", label: "Trainee · Sneha" },
    { u: "coord01", p: "Coord@123", label: "Coordinator" },
    { u: "coord02", p: "Coord@123", label: "Coord · Regional" },
    { u: "admin", p: "Admin@123", label: "Admin" },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 20% 20%, rgba(0,207,255,0.12), transparent 50%), radial-gradient(ellipse at 80% 10%, rgba(232,107,18,0.14), transparent 45%), radial-gradient(ellipse at 50% 100%, rgba(59,130,246,0.1), transparent 50%), #070d16",
      }}
    >
      <FloatingParticles />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMzBoNjBNMzAgMHYzMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBmaWxsPSJub25lIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+')] opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide mb-4"
            style={{ background: "rgba(0,207,255,0.12)", color: "#7dd3fc", border: "1px solid rgba(0,207,255,0.25)" }}
          >
            <Sparkles className="w-3.5 h-3.5" /> SIH26101 · MoSPI · Smart Education
          </motion.div>
          <h1 className="font-display text-4xl text-white tracking-tight">
            Prashikshan<span style={{ color: "#fb923c" }}>Setu</span>
          </h1>
          <p className="text-sm mt-2 text-slate-400 max-w-sm mx-auto">
            AI training bridge for Official Statistics — gaps, iGOT pathways, material → MCQs
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[1.35rem] p-7 space-y-4 border border-white/10"
          style={{
            background: "rgba(15, 23, 42, 0.72)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="grid grid-cols-3 gap-2 mb-1">
            {[
              { icon: Shield, t: "Gaps" },
              { icon: BookOpen, t: "iGOT path" },
              { icon: Bot, t: "AI coach" },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl py-2.5 text-center text-[11px] text-slate-300 border border-white/10 bg-white/5">
                <x.icon className="w-4 h-4 mx-auto mb-1 text-cyan-300" />
                {x.t}
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Username</label>
            <input
              className="w-full rounded-2xl border border-white/15 bg-white/5 text-white px-4 py-3 text-sm outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Password</label>
            <input
              type="password"
              className="w-full rounded-2xl border border-white/15 bg-white/5 text-white px-4 py-3 text-sm outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || ok}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
            style={{
              background: ok
                ? "linear-gradient(135deg,#0f7a4d,#34d399)"
                : "linear-gradient(135deg,#0891b2,#2563eb 50%,#7c3aed)",
              boxShadow: "0 12px 32px rgba(37,99,235,0.35)",
            }}
          >
            {ok ? "Welcome in…" : loading ? "Signing in…" : (
              <>Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <div className="pt-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Quick demo accounts</p>
            <div className="flex flex-wrap gap-2">
              {demos.map((d) => (
                <button
                  key={d.u}
                  type="button"
                  onClick={() => { setUsername(d.u); setPassword(d.p); }}
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium border border-white/15 text-slate-300 hover:border-cyan-400/40 hover:text-white hover:bg-white/5 transition"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </form>
        <p className="text-center text-[11px] text-slate-500 mt-5">Ministry of Statistics and Programme Implementation</p>
      </motion.div>
    </div>
  );
}
