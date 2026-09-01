import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { Users, AlertTriangle, Activity } from "lucide-react";
import { ProgressRing } from "../components/ProgressRing";
import { CardSkeleton } from "../components/Skeleton";

type Overview = {
  trainees: number;
  openGaps: number;
  domainAverages: { domain: string; average: number }[];
  gapSeverity: { severity: string; c: number }[];
};

type Attempt = {
  id: number;
  score: number;
  total: number;
  created_at: string;
  trainee_name: string;
  username: string;
  designation: string;
  quiz_title: string;
};

export default function AdminHome({ user }: { user: User }) {
  const [data, setData] = useState<Overview | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    api<Overview>("/api/admin/overview").then(setData).catch(() => setData(null));
    api<Attempt[]>("/api/admin/attempts").then(setAttempts).catch(() => setAttempts([]));
  }, []);

  const orgAvg =
    data && data.domainAverages.length
      ? Math.round(
          data.domainAverages.reduce((a, d) => a + d.average, 0) / data.domainAverages.length,
        )
      : 0;

  return (
    <div className="space-y-8 rise">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--mute)" }}>
          {user.role === "admin" ? "Administrator" : "Coordinator"} view
        </p>
        <h1 className="font-display text-3xl mt-1 heading">Workforce capacity snapshot</h1>
        <p className="text-sm mt-1" style={{ color: "var(--mute)" }}>
          Organization competency signals and assessment scores for DIID / training planning
        </p>
      </div>

      {!data ? (
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 card-lift flex items-center gap-4">
              <ProgressRing value={orgAvg} label="org" />
              <div>
                <div className="text-xs uppercase font-semibold text-ink-mute">Org readiness</div>
                <div className="font-display text-2xl mt-0.5">{orgAvg}%</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="card p-5 card-lift"
            >
              <div className="flex items-center gap-2 text-xs uppercase font-semibold text-ink-mute">
                <Users className="w-4 h-4" /> Trainees
              </div>
              <div className="font-display text-4xl mt-2">{data.trainees}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-5 card-lift"
            >
              <div className="flex items-center gap-2 text-xs uppercase font-semibold text-ink-mute">
                <AlertTriangle className="w-4 h-4 text-saffron" /> Open gaps
              </div>
              <div className="font-display text-4xl mt-2 text-saffron">{data.openGaps}</div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {data.gapSeverity.map((g) => (
                  <span
                    key={g.severity}
                    className={`pill ${
                      g.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {g.severity}: {g.c}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          <div>
            <h2 className="font-display text-xl mb-3">Domain averages</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.domainAverages.map((d, i) => (
                <motion.div
                  key={d.domain}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="card p-4 card-lift"
                >
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold">{d.domain}</span>
                    <span className="text-ink-mute font-semibold">{d.average}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-line overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.average}%` }}
                      transition={{ duration: 0.8, delay: 0.1 * i }}
                      className="h-full rounded-full"
                      style={{
                        background:
                          d.average >= 70
                            ? "var(--leaf)"
                            : d.average >= 50
                              ? "var(--saffron)"
                              : "#dc2626",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <h2 className="font-display text-xl mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-saffron" /> Recent assessment activity
        </h2>
        <div className="space-y-2">
          {attempts.slice(0, 12).map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-4 flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <div className="font-semibold text-sm">{a.trainee_name}</div>
                <div className="text-xs text-ink-mute">
                  {a.quiz_title} · {a.designation || a.username}
                </div>
              </div>
              <div className="text-right">
                <span className="font-display text-lg">
                  {a.score}/{a.total}
                </span>
                <div className="text-[11px] text-ink-mute">
                  {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                </div>
              </div>
            </motion.div>
          ))}
          {attempts.length === 0 && (
            <div className="empty-state">
              <p className="text-sm text-ink-mute">No attempts yet — trainees will appear here after submitting quizzes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
