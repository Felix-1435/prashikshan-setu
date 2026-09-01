import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import {
  BookOpen, Plus, RefreshCw, Search, Trash2, ExternalLink, Filter,
} from "lucide-react";

type Course = {
  id: number;
  code: string;
  title: string;
  domain: string;
  level: string;
  hours: number;
  provider: string;
  url: string;
  description?: string;
};

const DOMAINS = ["", "Statistical", "Technical", "Digital Governance", "Behavioural"];
const LEVELS = ["foundation", "intermediate", "advanced"];

const emptyForm = {
  code: "",
  title: "",
  domain: "Statistical",
  level: "foundation",
  hours: 6,
  provider: "iGOT Karmayogi",
  url: "https://igotkarmayogi.gov.in",
  description: "",
};

export default function Courses({ user }: { user: User }) {
  const [rows, setRows] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (domain) params.set("domain", domain);
      if (q.trim()) params.set("q", q.trim());
      const data = await api<Course[]>(`/api/courses?${params.toString()}`);
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [domain]);

  const sync = async () => {
    setSyncing(true);
    setMsg("");
    setErr("");
    try {
      const r = await api<{ total: number; message: string }>("/api/courses/sync", { method: "POST" });
      setMsg(`${r.message} Total: ${r.total}`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const create = async () => {
    setErr("");
    setMsg("");
    try {
      await api("/api/courses", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ ...emptyForm });
      setMsg("Course saved to Neon.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this course from the catalogue?")) return;
    try {
      await api(`/api/courses/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf">Catalogue</p>
          <h1 className="font-display text-3xl mt-1">iGOT & NSSTA courses</h1>
          <p className="text-sm text-ink-mute mt-1 max-w-xl">
            Browse, sync and add modules used for gap-based recommendations. Sync refreshes the curated
            iGOT Karmayogi + NSSTA TPAC metadata into Neon.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={() => void sync()} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync catalogue"}
          </button>
          <button className="btn btn-accent" onClick={() => setShowForm((v) => !v)}>
            <Plus className="w-4 h-4" /> Add course
          </button>
        </div>
      </div>

      {msg && (
        <p className="text-sm rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">{msg}</p>
      )}
      {err && (
        <p className="text-sm rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{err}</p>
      )}

      {showForm && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 space-y-3">
          <h2 className="font-display text-lg">Add / upsert course</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-mute uppercase">Code *</label>
              <input className="input mt-1" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="IGOT-STAT-999" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-mute uppercase">Title *</label>
              <input className="input mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-mute uppercase">Domain *</label>
              <select className="input mt-1" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
                {DOMAINS.filter(Boolean).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-mute uppercase">Level</label>
              <select className="input mt-1" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-mute uppercase">Hours</label>
              <input className="input mt-1" type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-mute uppercase">Provider</label>
              <input className="input mt-1" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-ink-mute uppercase">URL</label>
              <input className="input mt-1" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-ink-mute uppercase">Description</label>
              <textarea className="input mt-1 min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-accent" onClick={() => void create()}>Save to database</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            className="input pl-9"
            placeholder="Search title, code, provider…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load()}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-ink-mute" />
          <select className="input w-auto" value={domain} onChange={(e) => setDomain(e.target.value)}>
            <option value="">All domains</option>
            {DOMAINS.filter(Boolean).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button className="btn btn-ghost" onClick={() => void load()}>Search</button>
        </div>
      </div>

      {loading ? (
        <p className="text-ink-mute animate-pulse text-sm">Loading catalogue…</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-ink-mute">{rows.length} courses</p>
          {rows.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.03 }}
              className="card p-4 flex flex-wrap gap-3 items-start justify-between card-lift"
            >
              <div className="flex gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-leaf/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-leaf" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-xs text-ink-mute mt-0.5 flex flex-wrap gap-x-2 gap-y-1">
                    <span className="font-mono">{c.code}</span>
                    <span>{c.domain}</span>
                    <span className="pill bg-ink/5">{c.level}</span>
                    <span>{c.hours}h</span>
                    <span>{c.provider}</span>
                  </div>
                  {c.description && <p className="text-sm text-ink-mute mt-1 line-clamp-2">{c.description}</p>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <a href={c.url || "https://igotkarmayogi.gov.in"} target="_blank" rel="noreferrer" className="btn btn-ghost text-xs">
                  Open <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {(user.role === "admin" || user.role === "coordinator") && (
                  <button className="btn btn-ghost text-xs text-red-600" onClick={() => void remove(c.id)} title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {rows.length === 0 && (
            <div className="card p-8 text-center text-sm text-ink-mute">
              No courses match. Try <b>Sync catalogue</b> or clear filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
