import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { ExternalLink, BookOpen, Clock, Award, Building2, RefreshCw } from "lucide-react";

type Rec = {
  id: number;
  code: string;
  title: string;
  domain: string;
  level: string;
  hours: number;
  provider: string;
  url: string;
  description?: string;
  reason: string;
};

const levelColor: Record<string, string> = {
  foundation: "bg-emerald-100 text-emerald-800",
  intermediate: "bg-amber-100 text-amber-900",
  advanced: "bg-violet-100 text-violet-900",
};

export default function LearningPath({ user }: { user: User }) {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setLoading(true);
    api<{ recommendations: Rec[] }>(`/api/me/${user.id}/path`)
      .then((d) => setRecs(d.recommendations || []))
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  };

  const refreshRecs = async () => {
    setRefreshing(true);
    try {
      await api(`/api/me/${user.id}/recommendations/refresh`, { method: "POST" });
    } catch {
      /* still reload path */
    }
    load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [user.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf">Personalized path</p>
          <h1 className="font-display text-3xl mt-1">Recommended training</h1>
          <p className="text-sm text-ink-mute mt-1 max-w-2xl">
            Mapped from your open competency gaps to iGOT Karmayogi and NSSTA TPAC courses stored in Neon.
            Complete quizzes to recalibrate gaps; refresh to rewrite recommendation rows.
          </p>
        </div>
        <button className="btn btn-ghost text-xs shrink-0" onClick={() => void refreshRecs()} disabled={refreshing}>
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh from gaps"}
        </button>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-28" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {!loading &&
          recs.map((r, i) => (
            <motion.div
              key={`${r.id}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 flex flex-wrap gap-4 items-start justify-between card-lift"
            >
              <div className="flex gap-3 min-w-0 flex-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "color-mix(in srgb, var(--leaf) 14%, transparent)" }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: "var(--leaf)" }} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-base heading">{r.title}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-ink-mute">
                    <span className="font-mono">{r.code}</span>
                    <span className={`pill ${levelColor[r.level] || "bg-slate-100 text-slate-700"}`}>
                      <Award className="w-3 h-3" /> {r.level}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {r.hours}h
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> {r.provider}
                    </span>
                    <span className="pill bg-ink/5 text-ink">{r.domain}</span>
                  </div>
                  {r.description && (
                    <p className="text-sm text-ink-mute mt-2 line-clamp-2">{r.description}</p>
                  )}
                  <p className="text-sm text-ink mt-2 font-medium">{r.reason}</p>
                </div>
              </div>
              <a
                href={r.url || "https://igotkarmayogi.gov.in"}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost text-xs shrink-0"
              >
                Open on {r.provider?.includes("NSSTA") ? "NSSTA" : "iGOT"}{" "}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          ))}
        {!loading && recs.length === 0 && (
          <div className="card p-8 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-ink-mute mb-3 opacity-50" />
            <p className="text-ink-mute text-sm">No recommendations yet. Click Refresh from gaps or take a quiz.</p>
          </div>
        )}
      </div>
    </div>
  );
}
