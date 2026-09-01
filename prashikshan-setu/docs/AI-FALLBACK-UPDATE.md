# AI multi-model + local fallback update

## What changed

File: `server/src/ai.ts`

1. **Two-model cascade**  
   Tries Model 1, then Model 2 on OpenRouter. Only if both fail (or no API key) does it use the local responder.

2. **Local knowledge-base responder** (`offlineCoach`)  
   Expanded to handle general conversation (greetings, "who made you?", thanks, help) **and** domain topics (sampling, Python, SQL, SDG, iGOT, etc.). This is the "database of general conversations" style fallback that works offline / when free models are rate-limited.

3. **Env support**
   - `OPENROUTER_API_KEY` (required for remote models)
   - `OPENROUTER_MODEL` — primary model (optional)
   - `OPENROUTER_MODELS` — comma-separated list, e.g.  
     `google/gemini-2.0-flash-exp:free,meta-llama/llama-3.2-3b-instruct:free`

## Recommended free models (accuracy / availability)

| Priority | Model ID | Notes |
|----------|----------|-------|
| 1 | `google/gemini-2.0-flash-exp:free` | Strong reasoning, good default |
| 2 | `meta-llama/llama-3.2-3b-instruct:free` | Lightweight, often available when others are limited |
| Alt | `meta-llama/llama-3.1-8b-instruct:free` | Better quality if quota allows |
| Alt | `qwen/qwen-2.5-7b-instruct:free` | Strong alternative |

## Render / env variables to set

```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_MODELS=google/gemini-2.0-flash-exp:free,meta-llama/llama-3.2-3b-instruct:free
```

(You can keep only `OPENROUTER_MODEL`; the code still falls back to a second hard-coded free model.)

## Deploy steps (GitHub → Render)

1. Replace `server/src/ai.ts` with the file from this zip.
2. Commit & push to the repo that Render is connected to.
3. In Render dashboard → Environment → add/update the vars above → Save (auto-redeploy).
4. Test: ask the coach "who made you?" and "How do I improve sampling methods?"  
   - If both models succeed → full LLM answer.  
   - If rate-limited / fail → local knowledge-base answer (no longer the old generic gap dump).

## Optional later enhancement

Store frequently asked Q&A rows in Neon (`knowledge_base` table) and query them inside `offlineCoach` for even richer local replies. The current version already covers the common cases without a schema change.
