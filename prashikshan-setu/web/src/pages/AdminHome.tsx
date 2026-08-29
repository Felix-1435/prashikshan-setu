import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";

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

  return (
    <div className="space-y-8 rise">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--mute)" }}>
          {user.role === "admin" ? "Administrator" : "Coordinator"} view
        </p>
        <h1 className="font-display text-3xl mt-1">Workforce capacity snapshot</h1>
        <p className="text-sm mt-1" style={{ color: "var(--mute)" }}>
          Organization competency signals and assessment scores for DIID / training planning
        </p>
      </div>

      {!data ? (
        <p className="animate-pulse" style={{ color: "var(--mute)" }}>Loading…</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-3d p-5">
              <div className="text-xs uppercase font-semibold" style={{ color: "var(--mute)" }}>Trainees</div>
              <div className="font-display text-4xl mt-1">{data.trainees}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-3d p-5">
              <div className="text-xs uppercase font-semibold" style={{ color: "var(--mute)" }}>Open gaps</div>
              <div className="font-display text-4xl mt-1" style={{ color: "var(--saffron)" }}>{data.openGaps}</div>
            </motion.div>
          </div>

          <div>
            <h2 className="font-display text-xl mb-3">Domain averages</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.domainAverages.map((d) => (
                <div key={d.domain} className="card p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold">{d.domain}</span>
                    <span>{d.average}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                    <div className="h-full rounded-full" style={{ width: `${d.average}%`, background: "var(--leaf)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl mb-3">Gap severity mix</h2>
            <div className="flex flex-wrap gap-2">
              {data.gapSeverity.map((s) => (
                <span key={s.severity} className="pill" style={{ background: "color-mix(in srgb, var(--ink) 8%, transparent)" }}>
                  {s.severity}: {s.c}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <h2 className="font-display text-xl mb-1">Trainee assessment scores</h2>
        <p className="text-xs mb-3" style={{ color: "var(--mute)" }}>
          Submitted quizzes from officers — visible to coordinators and admin
        </p>
        <div className="space-y-2">
          {attempts.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card-3d p-4 flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <div className="font-semibold text-sm">{a.trainee_name}</div>
                <div className="text-xs" style={{ color: "var(--mute)" }}>
                  {a.username} · {a.designation || "Trainee"} · {a.quiz_title}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl">
                  {a.score}/{a.total}
                </div>
                <div className="text-[11px]" style={{ color: "var(--mute)" }}>
                  {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                </div>
              </div>
            </motion.div>
          ))}
          {attempts.length === 0 && (
            <p className="text-sm" style={{ color: "var(--mute)" }}>
              No submissions yet. After a trainee completes a quiz, scores appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
