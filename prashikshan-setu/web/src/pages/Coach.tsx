import { useState } from "react";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { Send } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string };

export default function Coach({ user }: { user: User }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text: "I am your PrashikshanSetu coach. Ask how to close a specific competency gap, or which iGOT module to take next.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!input.trim() || busy) return;
    const q = input.trim();
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const { reply } = await api<{ reply: string }>("/api/coach", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, message: q }),
      });
      setMsgs((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "Coach unavailable right now." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="font-display text-3xl">AI coach</h1>
        <p className="text-sm text-ink-mute">Gap-aware guidance for Official Statistics capacity building</p>
      </div>
      <div className="card p-4 h-[420px] overflow-y-auto space-y-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-2xl px-4 py-3 max-w-[90%] ${
              m.role === "user" ? "ml-auto bg-ink text-white" : "bg-paper border border-line"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="e.g. How do I improve sampling methods?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void send()}
        />
        <button className="btn-primary" onClick={() => void send()} disabled={busy}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
