import { useEffect, useState } from "react";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";

type Overview = {
  trainees: number;
  openGaps: number;
  domainAverages: { domain: string; average: number }[];
  gapSeverity: { severity: string; c: number }[];
};

export default function AdminHome({ user }: { user: User }) {
  const [data, setData] = useState<Overview | null>(null);
  useEffect(() => {
    api<Overview>("/api/admin/overview").then(setData).catch(() => setData(null));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-mute">
          {user.role === "admin" ? "Administrator" : "Coordinator"} view
        </p>
        <h1 className="font-display text-3xl mt-1">Workforce capacity snapshot</h1>
        <p className="text-sm text-ink-mute">Organization-level competency signals for DIID / training planning</p>
      </div>
      {!data ? (
        <p className="text-ink-mute animate-pulse">Loading…</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="text-xs uppercase text-ink-mute font-semibold">Trainees</div>
              <div className="font-display text-4xl mt-1">{data.trainees}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase text-ink-mute font-semibold">Open gaps</div>
              <div className="font-display text-4xl mt-1 text-saffron">{data.openGaps}</div>
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl mb-3">Domain averages</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.domainAverages.map((d) => (
                <div key={d.domain} className="card p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold">{d.domain}</span>
                    <span>{d.average}%</span>
                  </div>
                  <div className="h-2 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-leaf rounded-full" style={{ width: `${d.average}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl mb-3">Gap severity mix</h2>
            <div className="flex flex-wrap gap-2">
              {data.gapSeverity.map((s) => (
                <span key={s.severity} className="pill bg-ink/5 text-ink">
                  {s.severity}: {s.c}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
