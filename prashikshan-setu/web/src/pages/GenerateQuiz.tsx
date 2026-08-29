import { useState } from "react";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { FileUp, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function GenerateQuiz({ user }: { user: User }) {
  const [title, setTitle] = useState("Sample survey operations — unit notes");
  const [content, setContent] = useState(
    `Sample surveys are a cornerstone of official statistics. Sampling design choices (SRS, stratified, cluster) affect variance and cost.\n` +
      `Non-sampling errors include non-response, measurement error, and processing error.\n` +
      `Data quality frameworks emphasise relevance, accuracy, timeliness, accessibility, and coherence.\n` +
      `Field operations require training of enumerators, supervision, and validation checks before dissemination.`,
  );
  const [result, setResult] = useState<{
    quizId: number;
    questionCount: number;
    source: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api<{ quizId: number; questionCount: number; source: string }>(
        "/api/materials/quiz",
        {
          method: "POST",
          body: JSON.stringify({ title, content, userId: user.id, count: 8 }),
        },
      );
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-saffron">Coordinator tool</p>
        <h1 className="font-display text-3xl mt-1">Generate assessment from material</h1>
        <p className="text-sm text-ink-mute mt-1">
          Paste training notes, circulars, or module text. PrashikshanSetu builds objective MCQs with explanations
          (OpenRouter LLM when configured).
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-ink-mute">Title</label>
          <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-mute">Learning material</label>
          <textarea
            className="input mt-1 min-h-[200px] font-mono text-xs"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button className="btn-accent" onClick={() => void run()} disabled={loading}>
          <Sparkles className="w-4 h-4" />
          {loading ? "Generating…" : "Generate MCQs"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <div className="rounded-xl border border-leaf/30 bg-leaf/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-leaf">
              <FileUp className="w-4 h-4" /> Quiz ready · {result.questionCount} questions
            </div>
            <p className="text-ink-mute mt-1">Engine: {result.source}</p>
            <Link href={`/quizzes/${result.quizId}`}>
              <a className="btn-primary mt-3 inline-flex">Open / share assessment</a>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
