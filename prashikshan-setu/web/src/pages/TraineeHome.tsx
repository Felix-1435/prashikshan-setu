import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { AlertTriangle, Target, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "wouter";

type Dash = {
  overall: number;
  domains: { domain: string; average: number }[];
  scores: { domain: string; skill: string; score: number; target: number }[];
  openGaps: number;
  gaps: { id: number; domain: string; skill: string; severity: string; note: string }[];
};

/** Pure SVG radar — no extra chart library required */
function RadarChart({ domains }: { domains: { domain: string; average: number }[] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 95;
  const n = Math.max(domains.length, 3);
  const order = ["Statistical", "Technical", "Digital Governance", "Behavioural"];
  const sorted = order
    .map((d) => domains.find((x) => x.domain === d))
    .filter(Boolean) as { domain: string; average: number }[];
  const data = sorted.length >= 3 ? sorted : domains.slice(0, 4);
  const count = data.length || 4;

  const angle = (i: number) => (-Math.PI / 2) + (i * 2 * Math.PI) / count;
  const pt = (i: number, value: number) => {
    const r = (Math.max(0, Math.min(100, value)) / 100) * maxR;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };

  const rings = [25, 50, 75, 100];
  const poly = data.map((d, i) => pt(i, d.average).join(",")).join(" ");

  const short = (name: string) =>
    name === "Digital Governance" ? "Digital" : name === "Behavioural" ? "Behaviour" : name;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px]">
        {rings.map((r) => (
          <polygon
            key={r}
            fill="none"
            stroke="var(--line)"
            strokeWidth="1"
            points={Array.from({ length: count }, (_, i) => pt(i, r).join(",")).join(" ")}
          />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const [x, y] = pt(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" />;
        })}
        <polygon
          points={poly}
          fill="color-mix(in srgb, var(--saffron) 28%, transparent)"
          stroke="var(--saffron)"
          strokeWidth="2.5"
        />
        {data.map((d, i) => {
          const [x, y] = pt(i, d.average);
          return <circle key={d.domain} cx={x} cy={y} r="4.5" fill="var(--saffron)" />;
        })}
        {data.map((d, i) => {
          const [x, y] = pt(i, 118);
          return (
            <text
              key={`l-${d.domain}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current"
              style={{ fontSize: 11, fontWeight: 600, fill: "var(--ink)" }}
            >
              {short(d.domain)}
            </text>
          );
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-3 mt-1 text-xs text-ink-mute">
        {data.map((d) => (
          <span key={d.domain}>
            <b className="text-ink">{d.average}%</b> {short(d.domain)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TraineeHome({ user }: { user: User }) {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    api<Dash>(`/api/me/${user.id}/dashboard`).then(setData).catch(() => setData(null));
  }, [user.id]);

  if (!data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 rounded-lg bg-line" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-saffron">Trainee workspace</p>
        <h1 className="font-display text-3xl heading mt-1">Welcome, {user.name.split(" ")[0]}</h1>
        <p className="text-ink-mute text-sm mt-1">
          {user.designation} · {user.department}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 card-lift">
          <div className="text-xs text-ink-mute font-semibold uppercase">Overall readiness</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-4xl text-ink">{data.overall}</span>
            <span className="text-ink-mute mb-1">/ 100</span>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-line overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.overall}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-leaf rounded-full"
            />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-5 card-lift"
        >
          <div className="text-xs text-ink-mute font-semibold uppercase">Open skill gaps</div>
          <div className="mt-2 font-display text-4xl text-saffron">{data.openGaps}</div>
          <Link href="/path">
            <a className="text-sm text-ink mt-3 inline-flex items-center gap-1 font-semibold hover:underline">
              <Target className="w-4 h-4" /> View learning path
            </a>
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 card-lift"
        >
          <div className="text-xs text-ink-mute font-semibold uppercase">Domains tracked</div>
          <div className="mt-2 font-display text-4xl">{data.domains.length}</div>
          <p className="text-xs text-ink-mute mt-2">Statistical · Technical · Digital · Behavioural</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="card p-5"
        >
          <h2 className="font-display text-xl heading mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-saffron" /> Competency radar
          </h2>
          <p className="text-xs text-ink-mute mb-3">Domain averages vs target profile (live from Neon)</p>
          <RadarChart domains={data.domains} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="card p-5"
        >
          <h2 className="font-display text-xl heading mb-3">Skill breakdown</h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {data.scores.map((s) => {
              const pct = Math.round((s.score / Math.max(s.target, 1)) * 100);
              const below = s.score < s.target - 10;
              return (
                <div key={`${s.domain}-${s.skill}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate pr-2">
                      {s.skill}
                      <span className="text-ink-mute font-normal"> · {s.domain}</span>
                    </span>
                    <span className={below ? "text-saffron font-semibold" : "text-leaf font-semibold"}>
                      {s.score}/{s.target}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-line overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        background: below ? "var(--saffron)" : "var(--leaf)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div>
        <h2 className="font-display text-xl mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-saffron" /> Priority gaps
        </h2>
        <div className="space-y-2">
          {data.gaps.slice(0, 8).map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i }}
              className="card p-4 flex flex-wrap items-center justify-between gap-2 card-lift"
            >
              <div>
                <div className="font-semibold text-sm">{g.skill}</div>
                <div className="text-xs text-ink-mute">
                  {g.domain} · {g.note}
                </div>
              </div>
              <span
                className={`pill ${
                  g.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                }`}
              >
                {g.severity}
              </span>
            </motion.div>
          ))}
          {data.gaps.length === 0 && (
            <div className="card p-6 text-center">
              <Sparkles className="w-8 h-8 mx-auto text-leaf mb-2" />
              <p className="text-sm font-semibold">No open gaps — strong profile.</p>
              <p className="text-xs text-ink-mute mt-1">Keep practising quizzes to maintain readiness.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
