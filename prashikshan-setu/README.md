# PrashikshanSetu — SIH26101 (MoSPI)

AI training bridge: competency gaps → iGOT / NSSTA recommendations → material upload → LLM MCQs → live score → radar update.

## Phase 1 features (this build)

- Expanded iGOT + NSSTA course catalogue (upsert on every API start)
- Quiz domain tagging (Statistical / Technical / Digital Governance / Behavioural)
- **Live competency boost** after quiz attempts (scores + gap close)
- **Competency radar chart** on trainee home (SVG, no extra deps)
- Skill breakdown bars + priority gaps
- Richer Learning Path cards (level, hours, provider, reason)
- Improved Generate Quiz UX (steps, domain select, upload zone)

## Deploy

| Service | Root | Notes |
|---------|------|--------|
| **Render** (API) | `server` | Env: `DATABASE_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `FRONTEND_URL` |
| **Vercel** (Web) | `web` | Env: `VITE_API_URL` = Render URL (no trailing slash) |
| **Neon** | — | Tables auto-created + courses upserted on API boot |

Build commands unchanged:

```bash
# server
npm install && npm run build && npm start

# web
npm install && npm run build
```

## Demo accounts

| User | Password | Role |
|------|----------|------|
| trainee01 | Train@123 | trainee (Felix Shiju) |
| coord01 | Coord@123 | coordinator |
| admin | Admin@123 | admin |

## Suggested 3-min demo

1. Login `trainee01` → radar + gaps  
2. Login `coord01` → upload material → domain Statistical → Generate MCQs  
3. Login `trainee01` → take quiz → see competency impact  
4. Home → radar numbers move; Learning path refreshes  

See `docs/` for setup and pitch notes.
