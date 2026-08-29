import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import { saveUser, type User } from "../lib/auth";
import { ArrowRight, Sparkles, Route, FileUp, Shield } from "lucide-react";

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
      {/* Left brand panel — original layout, polished */}
      <div
        className="relative flex-1 p-10 md:p-14 flex flex-col justify-between min-h-[40vh] lg:min-h-screen overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0b1f3a 0%, #123554 45%, #0f3d3a 100%)",
          color: "#eef3fb",
        }}
      >
        <div className="absolute w-80 h-80 rounded-full bg-orange-400/20 blur-3xl -top-16 -left-10 pointer-events-none" />
        <div className="absolute w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl bottom-0 right-0 pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="text-xs uppercase tracking-[0.22em] text-white/45 mb-4">
            SIH 2026 · SIH26101 · MoSPI
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-white leading-tight">
            Prashikshan<span style={{ color: "#fb923c" }}>Setu</span>
          </h1>
          <p className="mt-4 text-white/70 text-sm md:text-[15px] max-w-md leading-relaxed">
            AI training bridge for MoSPI — competency gaps, iGOT Karmayogi pathways, and assessments
            from real training material.
          </p>
        </motion.div>

        <motion.ul
          className="relative z-10 space-y-4 mt-12"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        >
          {[
            { icon: Shield, text: "Competency map across Statistical, Technical, Digital & Behavioural domains" },
            { icon: Route, text: "Personalized iGOT / NSSTA recommendations" },
            { icon: FileUp, text: "Generate MCQs from uploaded notes in seconds" },
          ].map((item) => (
            <motion.li
              key={item.text}
              variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0 } }}
              className="flex gap-3 items-start text-sm text-white/90"
            >
              <span className="mt-0.5 w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-orange-300" />
              </span>
              <span className="pt-1.5">{item.text}</span>
            </motion.li>
          ))}
        </motion.ul>

        <div className="relative z-10 text-xs text-white/35 mt-10">
          Ministry of Statistics and Programme Implementation · Smart Education
        </div>
      </div>

      {/* Right form — light card on soft paper, original structure */}
      <div
        className="flex-1 grid place-items-center p-6 md:p-12"
        style={{
          background:
            "radial-gradient(600px 320px at 80% 10%, rgba(232,107,18,0.08), transparent), radial-gradient(500px 280px at 10% 90%, rgba(15,122,77,0.06), transparent), #f4f1eb",
        }}
      >
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={submit}
          className="w-full max-w-md rounded-[1.25rem] p-8 space-y-5 bg-white border border-[#e4e0d8] shadow-[0_20px_50px_rgba(12,27,51,0.08)]"
        >
          <div>
            <h2 className="font-display text-2xl text-[#0c1b33]">Sign in</h2>
            <p className="text-sm text-[#6b7c90] mt-1">Trainee, coordinator, or admin access</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6b7c90]">Username</label>
            <input
              className="w-full rounded-xl border border-[#e2ddd3] bg-[#faf9f7] text-[#0c1b33] px-3.5 py-2.5 text-sm outline-none focus:border-[#e86b12] focus:ring-2 focus:ring-orange-200/60 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6b7c90]">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-[#e2ddd3] bg-[#faf9f7] text-[#0c1b33] px-3.5 py-2.5 text-sm outline-none focus:border-[#e86b12] focus:ring-2 focus:ring-orange-200/60 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #0c1b33, #1e4a7a)",
              boxShadow: "0 10px 24px rgba(12,27,51,0.25)",
            }}
          >
            {loading ? "Signing in…" : (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-1 border-t border-[#eeeae3]">
            <p className="text-[10px] uppercase tracking-wider text-[#9aa8b8] mb-2 mt-3">Demo accounts</p>
            <div className="flex flex-wrap gap-2">
              {[
                ["trainee01", "Train@123", "Trainee"],
                ["coord01", "Coord@123", "Coordinator"],
                ["admin", "Admin@123", "Admin"],
              ].map(([u, p, label]) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => fill(u, p)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium border border-[#e2ddd3] text-[#3d4f66] hover:border-[#e86b12] hover:text-[#e86b12] transition bg-[#faf9f7]"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#9aa8b8] mt-3">
              trainee01 / Train@123 · coord01 / Coord@123 · admin / Admin@123
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
