import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { Link } from "wouter";

type Q = {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct?: string;
  explanation?: string;
};

type Result = {
  score: number;
  total: number;
  percentage: number;
  detail: {
    question: string;
    selected: string;
    correct: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  competencyImpact?: { updatedSkills: string[]; closedGaps: string[] };
};

export default function TakeQuiz({ user, id }: { user: User; id: number }) {
  const isStaff = user.role === "coordinator" || user.role === "admin";
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [prev, setPrev] = useState<{ score: number; total: number; created_at: string } | null>(null);
  const [retake, setRetake] = useState(false);

  useEffect(() => {
    const q = isStaff ? "?trainer=1" : "";
    api<{ title: string; questions: Q[] }>(`/api/quizzes/${id}${q}`).then((d) => {
      setTitle(d.title);
      setQuestions(d.questions || []);
    });
    if (!isStaff) {
      api<{ quiz_id: number; score: number; total: number; created_at: string }[]>(
        `/api/me/${user.id}/attempts`,
      )
        .then((rows) => {
          const hit = rows.find((r) => Number(r.quiz_id) === id);
          if (hit) setPrev({ score: hit.score, total: hit.total, created_at: hit.created_at });
        })
        .catch(() => {});
    }
  }, [id, user.id, isStaff]);

  const submit = async () => {
    const payload = Object.entries(answers).map(([questionId, selected]) => ({
      questionId: Number(questionId),
      selected,
    }));
    const r = await api<Result>(`/api/quizzes/${id}/attempt`, {
      method: "POST",
      body: JSON.stringify({ userId: user.id, answers: payload }),
    });
    setResult(r);
    setPrev({ score: r.score, total: r.total, created_at: new Date().toISOString() });
    setRetake(false);
  };

  if (isStaff) {
    return (
      <div className="max-w-2xl space-y-5 rise">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Coordinator review
          </p>
          <h1 className="font-display text-3xl heading mt-1">{title || "Quiz bank item"}</h1>
          <p className="text-sm muted mt-1">Answer key visible — trainees do not see correct options until submit.</p>
        </div>
        {questions.map((q, idx) => (
          <div key={q.id} className="card p-5 space-y-2">
            <p className="font-semibold text-sm heading">
              {idx + 1}. {q.question}
            </p>
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const label = q[`option${opt}` as keyof Q] as string;
              const isCorrect = q.correct === opt;
              return (
                <div
                  key={opt}
                  className={`text-sm rounded-lg px-3 py-2 ${isCorrect ? "result-ok font-semibold" : "bg-ink/5"}`}
                >
                  <b>{opt}.</b> {label}
                </div>
              );
            })}
            {q.explanation && <p className="text-xs muted pt-1">{q.explanation}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl space-y-5 rise">
        <h1 className="font-display text-3xl heading">{title}</h1>
        <div className="card score-hero p-6">
          <p className="text-sm opacity-80">Assessment complete</p>
          <div className="font-display text-5xl mt-1">
            {result.score}/{result.total}
          </div>
          <div className="text-lg opacity-90 mt-1">{result.percentage}%</div>
          {result.competencyImpact &&
            (result.competencyImpact.updatedSkills.length > 0 ||
              result.competencyImpact.closedGaps.length > 0) && (
              <div
                className="mt-4 text-left rounded-xl p-3 text-sm"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <p className="font-semibold mb-1">Competency update (live)</p>
                {result.competencyImpact.updatedSkills.slice(0, 5).map((s) => (
                  <p key={s} className="opacity-90">
                    ↑ {s}
                  </p>
                ))}
                {result.competencyImpact.closedGaps.map((g) => (
                  <p key={g} className="opacity-90">
                    ✓ Gap closed: {g}
                  </p>
                ))}
                <p className="opacity-70 text-xs mt-2">Open Home to see the radar chart jump.</p>
              </div>
            )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app">
            <a className="btn btn-primary">Back to home / radar</a>
          </Link>
          <Link href="/path">
            <a className="btn btn-ghost">Learning path</a>
          </Link>
          <Link href="/quizzes">
            <a className="btn btn-ghost">All assessments</a>
          </Link>
        </div>
        <div className="space-y-3">
          {result.detail.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card p-4 text-sm ${d.isCorrect ? "result-ok" : "result-bad"}`}
            >
              <p className="font-semibold heading">{d.question}</p>
              <p className="mt-1 sub">
                Your answer: <b>{d.selected || "—"}</b> · Correct: <b>{d.correct}</b>
              </p>
              {d.explanation && <p className="mt-1 muted">{d.explanation}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (prev && !retake) {
    return (
      <div className="max-w-2xl space-y-5 rise">
        <h1 className="font-display text-3xl heading">{title}</h1>
        <div className="card score-hero p-6">
          <p className="text-sm opacity-80">Previous attempt on file</p>
          <div className="font-display text-5xl mt-1">
            {prev.score}/{prev.total}
          </div>
          <p className="text-sm opacity-70 mt-2">
            {prev.created_at ? new Date(prev.created_at).toLocaleString() : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => setRetake(true)}>
            Take again
          </button>
          <Link href="/quizzes">
            <a className="btn btn-ghost">All assessments</a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 rise">
      <h1 className="font-display text-2xl heading">{title || "Assessment"}</h1>
      <p className="text-sm muted">Select one option per question, then submit for instant feedback and competency update.</p>
      {questions.map((q, idx) => (
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
          className="card card-lift p-5 space-y-3"
        >
          <p className="font-semibold text-sm heading">
            {idx + 1}. {q.question}
          </p>
          {(["A", "B", "C", "D"] as const).map((opt) => {
            const label = q[`option${opt}` as keyof Q] as string;
            const selected = answers[q.id] === opt;
            return (
              <label
                key={opt}
                className={`option-row flex items-center gap-2 ${selected ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={selected}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                />
                <span>
                  <b>{opt}.</b> {label}
                </span>
              </label>
            );
          })}
        </motion.div>
      ))}
      {questions.length > 0 && (
        <button className="btn btn-primary" onClick={() => void submit()}>
          Submit assessment
        </button>
      )}
    </div>
  );
}
