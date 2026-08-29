import { useEffect, useState } from "react";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { ExternalLink, BookOpen } from "lucide-react";

type Rec = {
  id: number;
  code: string;
  title: string;
  domain: string;
  level: string;
  hours: number;
  provider: string;
  url: string;
  reason: string;
};

export default function LearningPath({ user }: { user: User }) {
  const [recs, setRecs] = useState<Rec[]>([]);

  useEffect(() => {
    api<{ recommendations: Rec[] }>(`/api/me/${user.id}/path`)
      .then((d) => setRecs(d.recommendations || []))
      .catch(() => setRecs([]));
  }, [user.id]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-leaf">Personalized path</p>
        <h1 className="font-display text-3xl mt-1">Recommended training</h1>
        <p className="text-sm text-ink-mute mt-1 max-w-2xl">
          Mapped from your open competency gaps to iGOT Karmayogi catalogue modules and NSSTA TPAC programmes
          (connector ready for live APIs).
        </p>
      </div>
      <div className="space-y-3">
        {recs.map((r) => (
          <div key={r.id} className="card p-5 flex flex-wrap gap-4 items-start justify-between">
            <div className="flex gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-ink" />
              </div>
              <div>
                <div className="font-semibold">{r.title}</div>
                <div className="text-xs text-ink-mute mt-0.5">
                  {r.code} · {r.domain} · {r.level} · {r.hours}h · {r.provider}
                </div>
                <p className="text-sm text-ink mt-2">{r.reason}</p>
              </div>
            </div>
            <a
              href={r.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost text-xs shrink-0"
            >
              Open on iGOT <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
        {recs.length === 0 && <p className="text-ink-mute text-sm">No recommendations yet.</p>}
      </div>
    </div>
  );
}
