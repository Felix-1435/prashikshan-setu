import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { FileUp, Sparkles, Upload } from "lucide-react";
import { Link } from "wouter";
import { extractTextFromFile, ACCEPT_ATTR } from "../lib/extractText";

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
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [fileName, setFileName] = useState("");

  const onFile = async (file: File | null) => {
    if (!file) return;
    setError("");
    setWarning("");
    setResult(null);
    setFileName(file.name);
    setExtracting(true);
    try {
      const { text, warning: w } = await extractTextFromFile(file);
      setTitle(file.name.replace(/\.[^.]+$/, "") || "Uploaded material");
      setContent(text);
      if (w) setWarning(w);
    } catch (e) {
      setContent("");
      setError(e instanceof Error ? e.message : "Could not read this file.");
    } finally {
      setExtracting(false);
    }
  };

  const run = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    const trimmed = content.trim();
    if (trimmed.length < 40) {
      setError(
        "Provide at least ~40 characters of readable learning material. Upload a file or paste text.",
      );
      setLoading(false);
      return;
    }

    try {
      const data = await api<{ quizId: number; questionCount: number; source: string }>(
        "/api/materials/quiz",
        {
          method: "POST",
          body: JSON.stringify({ title, content: trimmed, userId: user.id, count: 8 }),
        },
      );
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quiz generation failed");
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
          Upload <strong>Word, PDF, Excel, PowerPoint, images</strong>, or plain text. Text is extracted in the
          browser, then MCQs are generated.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4 rounded-2xl border p-5"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <label
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition hover:border-[var(--saffron)]"
          style={{ borderColor: "var(--line)" }}
        >
          <Upload className="w-8 h-8 floaty" style={{ color: "var(--saffron)" }} />
          <span className="text-sm font-semibold">
            {extracting ? "Extracting text…" : "Upload learning material"}
          </span>
          <span className="text-xs text-center px-4" style={{ color: "var(--mute)" }}>
            {fileName || ".txt · .md · .docx · .pdf · .xlsx · .pptx · images"}
          </span>
          <input
            type="file"
            accept={ACCEPT_ATTR}
            className="hidden"
            disabled={extracting || loading}
            onChange={(e) => void onFile(e.target.files?.[0] || null)}
          />
        </label>

        <div>
          <label className="text-xs font-semibold" style={{ color: "var(--mute)" }}>
            Title
          </label>
          <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: "var(--mute)" }}>
            Learning material (extracted / editable)
          </label>
          <textarea
            className="input mt-1 min-h-[200px] font-mono text-xs"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or upload — extracted text appears here for review before generating MCQs…"
            disabled={extracting}
          />
        </div>
        <button
          className="btn btn-accent"
          onClick={() => void run()}
          disabled={loading || extracting}
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "Generating MCQs…" : extracting ? "Please wait…" : "Generate MCQs"}
        </button>
        {warning && (
          <p className="text-sm rounded-lg border border-amber-200 bg-amber-50 p-3" style={{ color: "#92400e" }}>
            {warning}
          </p>
        )}
        {error && (
          <pre
            className="text-sm whitespace-pre-wrap font-sans rounded-lg border border-red-200 bg-red-50 p-3"
            style={{ color: "#b91c1c" }}
          >
            {error}
          </pre>
        )}
        {result && (
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl border p-4 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--leaf) 40%, var(--line))",
              background: "color-mix(in srgb, var(--leaf) 8%, transparent)",
            }}
          >
            <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--leaf)" }}>
              <FileUp className="w-4 h-4" /> Quiz ready · {result.questionCount} questions
            </div>
            <p className="mt-1" style={{ color: "var(--mute)" }}>
              Engine: {result.source}
            </p>
            <Link href={`/quizzes/${result.quizId}`}>
              <a className="btn-primary mt-3 inline-flex">Open assessment</a>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
