import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { AlertTriangle, Target } from "lucide-react";
import { Link } from "wouter";

type Dash = {
  overall: number;
  domains: { domain: string; average: number }[];
  scores: { domain: string; skill: string; score: number; target: number }[];
  openGaps: number;
  gaps: { id: number; domain: string; skill: string; severity: string; note: string }[];
};

export default function TraineeHome({ user }: { user: User }) {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    api<Dash>(`/api/me/${user.id}/dashboard`).then(setData).catch(() => setData(null));
  }, [user.id]);

  if (!data) {
    return <div className="text-ink-mute animate-pulse">Loading competency map…</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-saffron">Trainee workspace</p>
        <h1 className="font-display text-3xl mt-1">Welcome, {user.name.split(" ")[0]}</h1>
        <p className="text-ink-mute text-sm mt-1">
          {user.designation} · {user.department}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="text-xs text-ink-mute font-semibold uppercase">Overall readiness</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-4xl text-ink">{data.overall}</span>
            <span className="text-ink-mute mb-1">/ 100</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-line overflow-hidden">
            <div className="h-full bg-leaf rounded-full" style={{ width: `${data.overall}%` }} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
          <div className="text-xs text-ink-mute font-semibold uppercase">Open skill gaps</div>
          <div className="mt-2 font-display text-4xl text-saffron">{data.openGaps}</div>
          <Link href="/path">
            <a className="text-sm text-ink mt-3 inline-flex items-center gap-1 font-semibold hover:underline">
              <Target className="w-4 h-4" /> View learning path
            </a>
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <div className="text-xs text-ink-mute font-semibold uppercase">Domains tracked</div>
          <div className="mt-2 font-display text-4xl">{data.domains.length}</div>
          <p className="text-xs text-ink-mute mt-2">Statistical · Technical · Digital · Behavioural</p>
        </motion.div>
      </div>

      <div>
        <h2 className="font-display text-xl mb-3">Domain averages</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {data.domains.map((d) => (
            <div key={d.domain} className="card p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold">{d.domain}</span>
                <span className="text-ink-mute">{d.average}%</span>
              </div>
              <div className="h-2 rounded-full bg-line overflow-hidden">
                <div
                  className="h-full rounded-full bg-ink"
                  style={{ width: `${d.average}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-saffron" /> Priority gaps
        </h2>
        <div className="space-y-2">
          {data.gaps.slice(0, 8).map((g) => (
            <div key={g.id} className="card p-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-sm">{g.skill}</div>
                <div className="text-xs text-ink-mute">{g.domain} · {g.note}</div>
              </div>
              <span
                className={`pill ${
                  g.severity === "high"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {g.severity}
              </span>
            </div>
          ))}
          {data.gaps.length === 0 && (
            <p className="text-sm text-ink-mute">No open gaps — strong profile.</p>
          )}
        </div>
      </div>
    </div>
  );
}
