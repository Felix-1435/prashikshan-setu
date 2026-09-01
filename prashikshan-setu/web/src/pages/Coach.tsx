import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/utils";
import type { User } from "../lib/auth";
import { MessageCircle, Send, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string };

export default function Coach({ user }: { user: User }) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Namaste. I am your PrashikshanSetu coach. Ask about sample surveys, CAPI, price statistics, or how to close a competency gap.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const r = await api<{ reply: string }>("/api/coach", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, message: text }),
      });
      setMsgs((m) => [...m, { role: "assistant", text: r.reply }]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", text: "Sorry — coach is temporarily unavailable. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl rise">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-saffron">AI coach</p>
        <h1 className="font-display text-3xl heading mt-1 flex items-center gap-2">
          <MessageCircle className="w-7 h-7 text-saffron" /> Guided help
        </h1>
        <p className="text-sm muted mt-1">
          Answers are grounded in your open gaps when available. For SIH demo, free OpenRouter models power replies.
        </p>
      </div>

      <div className="card p-4 md:p-5 space-y-3 min-h-[320px] flex flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto max-h-[50vh] pr-1">
          {msgs.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-[92%] ${
                m.role === "user" ? "ml-auto" : ""
              }`}
              style={
                m.role === "user"
                  ? {
                      background: "linear-gradient(135deg, #e87722, #f09a4a)",
                      color: "#fff",
                    }
                  : {
                      background: "color-mix(in srgb, var(--ink) 6%, transparent)",
                      color: "var(--ink)",
                    }
              }
            >
              {m.role === "assistant" && (
                <Sparkles className="w-3.5 h-3.5 inline mr-1.5 opacity-70" />
              )}
              {m.text}
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-1.5 px-2 py-2">
              <span className="w-2 h-2 rounded-full bg-saffron animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-saffron animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="w-2 h-2 rounded-full bg-saffron animate-bounce" style={{ animationDelay: "240ms" }} />
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--line)" }}>
          <input
            className="input flex-1"
            placeholder="Ask about sampling, gaps, iGOT modules…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send()}
            disabled={loading}
          />
          <button className="btn btn-accent shrink-0" onClick={() => void send()} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
