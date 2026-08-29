import { useEffect, useState } from "react";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";

type Q = {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

export default function TakeQuiz({ user, id }: { user: User; id: number }) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    detail: { question: string; selected: string; correct: string; isCorrect: boolean; explanation: string }[];
  } | null>(null);

  useEffect(() => {
    api<{ title: string; questions: Q[] }>(`/api/quizzes/${id}`).then((d) => {
      setTitle(d.title);
      setQuestions(d.questions || []);
    });
  }, [id]);

  const submit = async () => {
    const payload = Object.entries(answers).map(([questionId, selected]) => ({
      questionId: Number(questionId),
      selected,
    }));
    const r = await api<typeof result extends infer T ? NonNullable<T> : never>(`/api/quizzes/${id}/attempt`, {
      method: "POST",
      body: JSON.stringify({ userId: user.id, answers: payload }),
    });
    setResult(r);
  };

  if (result) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="font-display text-3xl">Result</h1>
        <div className="card p-6">
          <div className="font-display text-4xl">
            {result.score}/{result.total}
          </div>
          <div className="text-ink-mute">{result.percentage}%</div>
        </div>
        <div className="space-y-3">
          {result.detail.map((d, i) => (
            <div
              key={i}
              className={`card p-4 text-sm ${d.isCorrect ? "border-leaf/40" : "border-red-200"}`}
            >
              <p className="font-semibold">{d.question}</p>
              <p className="mt-1">
                Your answer: <b>{d.selected || "—"}</b> · Correct: <b>{d.correct}</b>
              </p>
              {d.explanation && <p className="text-ink-mute mt-1">{d.explanation}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl">{title || "Assessment"}</h1>
      {questions.map((q, idx) => (
        <div key={q.id} className="card p-5 space-y-3">
          <p className="font-semibold text-sm">
            {idx + 1}. {q.question}
          </p>
          {(["A", "B", "C", "D"] as const).map((opt) => {
            const label = q[`option${opt}` as keyof Q] as string;
            return (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                />
                <span>
                  <b>{opt}.</b> {label}
                </span>
              </label>
            );
          })}
        </div>
      ))}
      {questions.length > 0 && (
        <button className="btn-primary" onClick={() => void submit()}>
          Submit assessment
        </button>
      )}
    </div>
  );
}
