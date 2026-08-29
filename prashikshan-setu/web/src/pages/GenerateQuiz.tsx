import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { FileUp, Sparkles, Upload } from "lucide-react";
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
  const [fileName, setFileName] = useState("");

  const onFile = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setTitle(file.name.replace(/\.[^.]+$/, ""));
    const text = await file.text();
    setContent(text.slice(0, 50000));
  };

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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--saffron)" }}>
          Coordinator · Intelligent Assessment Engine
        </p>
        <h1 className="font-display text-3xl mt-1">Generate assessment from material</h1>
        <p className="text-sm mt-1" style={{ color: "var(--mute)" }}>
          Upload a text/markdown notes file or paste training content. PrashikshanSetu builds objective MCQs with
          explanations for capacity building (SIH26101).
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-5 space-y-4"
      >
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition hover:border-[var(--saffron)]"
          style={{ borderColor: "var(--line)" }}>
          <Upload className="w-8 h-8 floaty" style={{ color: "var(--saffron)" }} />
          <span className="text-sm font-semibold">Upload learning material (.txt / .md)</span>
          <span className="text-xs" style={{ color: "var(--mute)" }}>
            {fileName || "or paste text below — PDF text can be copied in"}
          </span>
          <input
            type="file"
            accept=".txt,.md,.csv,.json,text/plain"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0] || null)}
          />
        </label>

        <div>
          <label className="text-xs font-semibold" style={{ color: "var(--mute)" }}>Title</label>
          <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: "var(--mute)" }}>Learning material</label>
          <textarea
            className="input mt-1 min-h-[200px] font-mono text-xs"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button className="btn btn-accent" onClick={() => void run()} disabled={loading}>
          <Sparkles className="w-4 h-4" />
          {loading ? "Generating MCQs…" : "Generate MCQs"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl border p-4 text-sm"
            style={{ borderColor: "color-mix(in srgb, var(--leaf) 40%, var(--line))", background: "color-mix(in srgb, var(--leaf) 8%, transparent)" }}
          >
            <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--leaf)" }}>
              <FileUp className="w-4 h-4" /> Quiz ready · {result.questionCount} questions
            </div>
            <p className="mt-1" style={{ color: "var(--mute)" }}>Engine: {result.source}</p>
            <Link href={`/quizzes/${result.quizId}`}>
              <a className="btn-primary mt-3 inline-flex">Open assessment</a>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
