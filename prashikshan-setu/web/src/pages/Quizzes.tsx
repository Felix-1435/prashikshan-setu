import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { ClipboardList, CheckCircle2, Eye, Inbox } from "lucide-react";
import { CardSkeleton } from "../components/Skeleton";

type Row = { id: number; title: string; domain: string; question_count: number; created_at: string };
type Attempt = { quiz_id: number; score: number; total: number };

export default function Quizzes({ user }: { user: User }) {
  const isStaff = user.role !== "trainee";
  const [rows, setRows] = useState<Row[] | null>(null);
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});

  useEffect(() => {
    api<Row[]>("/api/quizzes")
      .then(setRows)
      .catch(() => setRows([]));
    if (!isStaff) {
      api<Attempt[]>(`/api/me/${user.id}/attempts`)
        .then((list) => {
          const map: Record<number, Attempt> = {};
          for (const a of list) map[Number(a.quiz_id)] = a;
          setAttempts(map);
        })
        .catch(() => {});
    }
  }, [user.id, isStaff]);

  return (
    <div className="space-y-6 rise">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-saffron">Assessments</p>
        <h1 className="font-display text-3xl heading mt-1">{isStaff ? "Quiz bank" : "My assessments"}</h1>
        <p className="text-sm muted mt-1">
          {isStaff
            ? "Review generated quizzes and answer keys."
            : "Complete quizzes. Finished items show your latest score and feed the competency radar."}
        </p>
      </div>

      {rows === null && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {rows?.map((r, i) => {
          const att = attempts[r.id];
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/quizzes/${r.id}`}>
                <a className="card card-lift p-4 flex items-center gap-3 block">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "color-mix(in srgb, var(--accent) 16%, transparent)" }}
                  >
                    {isStaff ? (
                      <Eye className="w-5 h-5" style={{ color: "var(--accent)" }} />
                    ) : (
                      <ClipboardList className="w-5 h-5" style={{ color: "var(--accent)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate heading">{r.title}</div>
                    <div className="text-xs muted">
                      {r.question_count} questions · {r.domain || "Training"} ·{" "}
                      {isStaff ? "Review mode" : "Trainee attempt"}
                    </div>
                  </div>
                  {att && (
                    <span
                      className="pill shrink-0"
                      style={{
                        background: "color-mix(in srgb, var(--ok) 16%, transparent)",
                        color: "var(--ok)",
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {att.score}/{att.total}
                    </span>
                  )}
                </a>
              </Link>
            </motion.div>
          );
        })}
        {rows && rows.length === 0 && (
          <div className="empty-state">
            <Inbox className="w-10 h-10 mx-auto text-ink-mute opacity-50 mb-3" />
            <p className="font-semibold text-sm">No quizzes yet</p>
            <p className="text-sm muted mt-1">
              {isStaff
                ? "Create one under Build quiz from uploaded material."
                : "Ask your coordinator to publish an assessment."}
            </p>
            {isStaff && (
              <Link href="/generate">
                <a className="btn btn-accent mt-4 inline-flex">Build quiz</a>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
