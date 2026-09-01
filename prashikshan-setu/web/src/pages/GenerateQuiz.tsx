import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { FileUp, Sparkles, Upload, Layers, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { extractTextFromFile, ACCEPT_ATTR } from "../lib/extractText";

const DOMAINS = [
  "Statistical",
  "Technical",
  "Digital Governance",
  "Behavioural",
] as const;

export default function GenerateQuiz({ user }: { user: User }) {
  const [title, setTitle] = useState("Sample survey operations — unit notes");
  const [domain, setDomain] = useState<string>("Statistical");
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
          body: JSON.stringify({
            title,
            content: trimmed,
            userId: user.id,
            count: 8,
            domain,
          }),
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-saffron">Coordinator tools</p>
        <h1 className="font-display text-3xl heading mt-1">Build assessment from material</h1>
        <p className="text-sm text-ink-mute mt-1">
          Upload iGOT / NSSTA notes, manuals or slides — extract text, review, then generate MCQs tagged to a competency domain.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { n: 1, label: "Upload / paste" },
          { n: 2, label: "Tag domain" },
          { n: 3, label: "Generate MCQs" },
        ].map((s) => (
          <span
            key={s.n}
            className="pill bg-ink/5 text-ink inline-flex items-center gap-1.5"
          >
            <span className="w-5 h-5 rounded-full bg-saffron/20 text-saffron grid place-items-center text-[11px]">
              {s.n}
            </span>
            {s.label}
          </span>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5 space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink-mute uppercase">Material title</label>
            <input
              className="input mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MoSPI CAPI field manual"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-mute uppercase flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Competency domain
            </label>
            <select
              className="input mt-1"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink-mute uppercase">Upload file (optional)</label>
          <label className="mt-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition hover:border-saffron/50"
            style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--saffron) 4%, transparent)" }}>
            <Upload className="w-8 h-8 text-saffron" />
            <span className="text-sm font-medium">
              {extracting ? "Extracting text…" : fileName || "Drop PDF, DOCX, PPTX, XLSX, images or TXT"}
            </span>
            <span className="text-xs text-ink-mute">Client-side extraction · text appears below for review</span>
            <input
              type="file"
              className="hidden"
              accept={ACCEPT_ATTR}
              disabled={extracting}
              onChange={(e) => void onFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink-mute uppercase">Learning material text</label>
          <textarea
            className="input mt-1 min-h-[200px] font-mono text-[13px] leading-relaxed"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or upload — extracted text appears here for review before generating MCQs…"
            disabled={extracting}
          />
          <p className="text-xs text-ink-mute mt-1">{content.trim().length} characters</p>
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
              <CheckCircle2 className="w-4 h-4" /> Quiz ready · {result.questionCount} questions · domain {domain}
            </div>
            <p className="mt-1" style={{ color: "var(--mute)" }}>
              Engine: {result.source}
              {result.source === "fallback"
                ? " (OpenRouter failed — generic demo questions, not from your file)"
                : " (from your material)"}
            </p>
            {result.source === "fallback" && (
              <p className="mt-2 text-sm rounded-lg border border-amber-200 bg-amber-50 p-3" style={{ color: "#92400e" }}>
                Questions are from the built-in fallback bank, not your uploaded content.
                Fix: set a valid OPENROUTER_API_KEY on the API (Render), use working free model ids,
                redeploy, then generate again. Check /api/health → openrouter.keyConfigured.
              </p>
            )}
            <Link href={`/quizzes/${result.quizId}`}>
              <a className="btn btn-primary mt-3 inline-flex">
                <FileUp className="w-4 h-4" /> Open assessment
              </a>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
