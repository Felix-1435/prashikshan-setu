import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import { saveUser, type User } from "../lib/auth";
import { Sparkles } from "lucide-react";

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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-[48%] bg-ink text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, #E87722 0%, transparent 40%), radial-gradient(circle at 80% 60%, #1B7A4E 0%, transparent 35%)",
          }}
        />
        <div className="relative">
          <div className="font-display text-4xl">PrashikshanSetu</div>
          <p className="mt-2 text-white/70 text-sm max-w-sm">
            AI training bridge for MoSPI — competency gaps, iGOT Karmayogi pathways, and assessments from real training material.
          </p>
        </div>
        <div className="relative space-y-4">
          {[
            "Competency map across Statistical, Technical, Digital & Behavioural domains",
            "Personalized iGOT / NSSTA recommendations",
            "Generate MCQs from uploaded notes in seconds",
          ].map((t) => (
            <div key={t} className="flex gap-3 text-sm text-white/85">
              <Sparkles className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
              {t}
            </div>
          ))}
        </div>
        <div className="relative text-xs text-white/40">SIH 2026 · PS SIH26101 · Smart Education</div>
      </div>

      <div className="flex-1 grid place-items-center p-6">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submit}
          className="card w-full max-w-md p-8 space-y-5"
        >
          <div>
            <h1 className="font-display text-2xl text-ink">Sign in</h1>
            <p className="text-sm text-ink-mute mt-1">Trainee, coordinator, or admin access</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-mute">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-mute">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Continue"}
          </button>
          <div className="text-xs text-ink-mute space-y-1 border-t border-line pt-4">
            <p>
              <b>trainee01</b> / Train@123 · <b>coord01</b> / Coord@123 · <b>admin</b> / Admin@123
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
