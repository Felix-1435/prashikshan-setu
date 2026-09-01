import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import { saveUser, type User } from "../lib/auth";
import { ArrowRight, Sparkles, Route, FileUp, Shield, BookOpen, Users } from "lucide-react";

const features = [
  { icon: Route, title: "Competency pathways", desc: "Map gaps to iGOT & NSSTA modules" },
  { icon: FileUp, title: "Smart assessments", desc: "MCQs from real training material" },
  { icon: Sparkles, title: "AI coach", desc: "Practical guidance for MoSPI trainees" },
  { icon: Shield, title: "Official focus", desc: "Survey design, sampling, data quality" },
];

const demos = [
  { role: "Trainee", user: "trainee01", pass: "Train@123", hint: "Felix Shiju" },
  { role: "Coordinator", user: "coord01", pass: "Coord@123", hint: "Shivangi" },
  { role: "Admin", user: "admin", pass: "Admin@123", hint: "Platform" },
];

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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* India-inspired ambient background on form side */}
      <div className="pointer-events-none absolute inset-0 lg:left-1/2 tricolor-wash opacity-40" />

      {/* Left brand panel */}
      <div className="relative flex-1 p-8 md:p-14 flex flex-col justify-between min-h-[42vh] lg:min-h-screen overflow-hidden india-panel text-white">
        {/* Animated orbs */}
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-orange-400/25 blur-3xl -top-20 -left-10"
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl bottom-0 right-0"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-white/10 blur-2xl top-1/3 right-1/4"
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Subtle Ashoka-inspired ring */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block opacity-[0.07]">
          <div className="w-56 h-56 rounded-full border-2 border-white relative">
            <div className="absolute inset-4 rounded-full border border-white/80" />
            <div className="absolute inset-10 rounded-full border border-white/60" />
            <div className="absolute inset-[4.5rem] rounded-full bg-white/30" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-saffron animate-pulse" />
            SIH 2026 · SIH26101 · MoSPI
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[3.25rem] text-white leading-[1.1]">
            Prashikshan
            <span className="text-saffron-soft">Setu</span>
          </h1>
          <p className="mt-4 text-white/70 text-sm md:text-[15px] max-w-md leading-relaxed">
            AI training bridge for India&apos;s Official Statistical System — competency gaps,
            iGOT Karmayogi pathways, and assessments from real unit notes.
          </p>
        </motion.div>

        <motion.ul
          className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 mb-6"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.li
              key={title}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-3.5 hover:bg-white/10 transition"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-saffron/20 p-2 text-saffron-soft">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="text-xs text-white/55 mt-0.5 leading-snug">{desc}</div>
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 flex items-center gap-3 text-xs text-white/45"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Trainees · Coordinators · Admins</span>
          <span className="mx-1">·</span>
          <BookOpen className="w-3.5 h-3.5" />
          <span>Aligned to iGOT &amp; NSSTA</span>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="relative flex-1 flex items-center justify-center p-6 md:p-12 bg-paper">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-saffron via-white to-leaf mb-5 shadow-sm border border-black/5" />
            <h2 className="font-display text-2xl md:text-3xl text-ink">Sign in</h2>
            <p className="text-sm text-ink-mute mt-1">Use a demo account or your assigned credentials.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-mute">Username</label>
              <input
                className="input mt-1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-mute">Password</label>
              <input
                type="password"
                className="input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
            <button type="submit" className="btn btn-accent w-full justify-center" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>
                  Enter PrashikshanSetu <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">Quick demo access</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {demos.map((d, i) => (
                <motion.button
                  key={d.user}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setUsername(d.user);
                    setPassword(d.pass);
                  }}
                  className="rounded-xl border border-line bg-white px-3 py-2.5 text-left shadow-sm hover:border-saffron/40 hover:shadow-md transition"
                >
                  <div className="text-[11px] font-semibold text-saffron">{d.role}</div>
                  <div className="text-xs text-ink mt-0.5 font-medium">{d.hint}</div>
                  <div className="text-[10px] text-ink-mute mt-0.5">{d.user}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-[11px] text-ink-mute leading-relaxed">
            Built for capacity building under India&apos;s Official Statistical System. Demo data only — not an official MoSPI production system.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
