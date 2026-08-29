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
};

export default function TakeQuiz({ user, id }: { user: User; id: number }) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [prev, setPrev] = useState<{ score: number; total: number; created_at: string } | null>(null);
  const [retake, setRetake] = useState(false);

  useEffect(() => {
    api<{ title: string; questions: Q[] }>(`/api/quizzes/${id}`).then((d) => {
      setTitle(d.title);
      setQuestions(d.questions || []);
    });
    api<{ quiz_id: number; score: number; total: number; created_at: string }[]>(`/api/me/${user.id}/attempts`)
      .then((rows) => {
        const hit = rows.find((r) => Number(r.quiz_id) === id);
        if (hit) setPrev({ score: hit.score, total: hit.total, created_at: hit.created_at });
      })
      .catch(() => {});
  }, [id, user.id]);

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

  if (result) {
    return (
      <div className="max-w-2xl space-y-4 rise">
        <h1 className="font-display text-3xl">Result</h1>
        <div className="card-3d score-hero p-6">
          <div className="font-display text-5xl text-white">
            {result.score}/{result.total}
          </div>
          <div className="text-white/80 text-lg mt-1">{result.percentage}%</div>
        </div>
        <div className="flex gap-2">
          <Link href="/quizzes"><a className="btn-ghost">Back to assessments</a></Link>
          <button className="btn-primary" onClick={() => { setResult(null); setAnswers({}); setRetake(true); }}>
            Retake
          </button>
        </div>
        <div className="space-y-3">
          {result.detail.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`card p-4 text-sm ${d.isCorrect ? "result-ok" : "result-bad"}`}
            >
              <p className="font-semibold">{d.question}</p>
              <p className="mt-1">
                Your answer: <b>{d.selected || "—"}</b> · Correct: <b>{d.correct}</b>
              </p>
              {d.explanation && <p className="mt-1" style={{ color: "var(--mute)" }}>{d.explanation}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (prev && !retake) {
    return (
      <div className="max-w-2xl space-y-5 rise">
        <h1 className="font-display text-3xl">{title || "Assessment"}</h1>
        <div className="card-3d score-hero p-6">
          <p className="text-white/70 text-sm">Previous attempt</p>
          <div className="font-display text-5xl text-white mt-1">
            {prev.score}/{prev.total}
          </div>
          <p className="text-white/70 text-sm mt-2">
            {prev.created_at ? new Date(prev.created_at).toLocaleString() : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => setRetake(true)}>Take again</button>
          <Link href="/quizzes"><a className="btn-ghost">All assessments</a></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 rise">
      <h1 className="font-display text-2xl">{title || "Assessment"}</h1>
      {questions.map((q, idx) => (
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
          className="card-3d p-5 space-y-3"
        >
          <p className="font-semibold text-sm">
            {idx + 1}. {q.question}
          </p>
          {(["A", "B", "C", "D"] as const).map((opt) => {
            const label = q[`option${opt}` as keyof Q] as string;
            const selected = answers[q.id] === opt;
            return (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm cursor-pointer rounded-xl px-3 py-2 border transition"
                style={{
                  borderColor: selected ? "var(--saffron)" : "var(--line)",
                  background: selected ? "color-mix(in srgb, var(--saffron) 12%, transparent)" : "transparent",
                }}
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
        <button className="btn-primary" onClick={() => void submit()}>
          Submit assessment
        </button>
      )}
    </div>
  );
}
