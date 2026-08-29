import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { ClipboardList } from "lucide-react";

type Row = {
  id: number;
  title: string;
  domain: string;
  question_count: number;
  created_at: string;
};

export default function Quizzes({ user }: { user: User }) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    api<Row[]>("/api/quizzes").then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Assessments</h1>
        <p className="text-sm text-ink-mute">
          {user.role === "trainee"
            ? "Take quizzes generated from training material."
            : "Quizzes created from uploaded content."}
        </p>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <Link key={r.id} href={`/quizzes/${r.id}`}>
            <a className="card p-4 flex items-center gap-3 hover:border-ink/30 transition">
              <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-saffron" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{r.title}</div>
                <div className="text-xs text-ink-mute">
                  {r.question_count} questions · {r.domain || "Training"}
                </div>
              </div>
            </a>
          </Link>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-ink-mute">No quizzes yet. Coordinators can generate one from material.</p>
        )}
      </div>
    </div>
  );
}
