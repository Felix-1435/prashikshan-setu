import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { ClipboardList, CheckCircle2 } from "lucide-react";

type Row = {
  id: number;
  title: string;
  domain: string;
  question_count: number;
  created_at: string;
};

type Attempt = { quiz_id: number; score: number; total: number };

export default function Quizzes({ user }: { user: User }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});

  useEffect(() => {
    api<Row[]>("/api/quizzes").then(setRows).catch(() => setRows([]));
    if (user.role === "trainee") {
      api<Attempt[]>(`/api/me/${user.id}/attempts`)
        .then((list) => {
          const map: Record<number, Attempt> = {};
          for (const a of list) map[Number(a.quiz_id)] = a;
          setAttempts(map);
        })
        .catch(() => {});
    }
  }, [user.id, user.role]);

  return (
    <div className="space-y-6 rise">
      <div>
        <h1 className="font-display text-3xl">Assessments</h1>
        <p className="text-sm mt-1" style={{ color: "var(--mute)" }}>
          {user.role === "trainee"
            ? "Take quizzes generated from training material. Completed ones show your score."
            : "Quizzes created from uploaded content."}
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((r, i) => {
          const att = attempts[r.id];
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={`/quizzes/${r.id}`}>
                <a className="card-3d p-4 flex items-center gap-3 hover:border-[var(--saffron)] transition block">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "color-mix(in srgb, var(--saffron) 15%, transparent)" }}
                  >
                    <ClipboardList className="w-5 h-5" style={{ color: "var(--saffron)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.title}</div>
                    <div className="text-xs" style={{ color: "var(--mute)" }}>
                      {r.question_count} questions · {r.domain || "Training"}
                    </div>
                  </div>
                  {att && (
                    <span className="pill flex items-center gap-1" style={{ background: "color-mix(in srgb, var(--leaf) 15%, transparent)", color: "var(--leaf)" }}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {att.score}/{att.total}
                    </span>
                  )}
                </a>
              </Link>
            </motion.div>
          );
        })}
        {rows.length === 0 && (
          <p className="text-sm" style={{ color: "var(--mute)" }}>
            No quizzes yet. Coordinators can generate one from material under Build quiz.
          </p>
        )}
      </div>
    </div>
  );
}
