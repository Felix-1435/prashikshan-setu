# PrashikshanSetu — SIH26101 (MoSPI)

AI training bridge: competency gaps → iGOT / NSSTA recommendations → material upload → LLM MCQs → live score → radar update.

## Phase 1 + Phase 2 (this build)

### Phase 1


- Expanded iGOT + NSSTA course catalogue (upsert on every API start)
- Quiz domain tagging (Statistical / Technical / Digital Governance / Behavioural)
- **Live competency boost** after quiz attempts (scores + gap close)
- **Competency radar chart** on trainee home (SVG, no extra deps)
- Skill breakdown bars + priority gaps
- Richer Learning Path cards (level, hours, provider, reason)
- Improved Generate Quiz UX (steps, domain select, upload zone)

### Phase 2 — iGOT integration
- `GET /api/courses` with domain + search filters
- `POST /api/courses/sync` — re-upsert curated iGOT + NSSTA catalogue into Neon
- `POST /api/courses` — coordinator/admin add or upsert a course
- `PUT/DELETE /api/courses/:id`
- `POST /api/me/:id/recommendations/refresh` — write gap→course rows into `recommendations`
- Learning Path prefers stored recommendations; falls back to live gap→course map
- **Courses** page in coordinator & admin nav (browse, search, sync, add, delete)

### Phase 3 — UI polish
- Premium cards with lift hover, tricolor accents
- Progress rings (overall readiness + org snapshot)
- Shimmer loading skeletons
- Empty states with CTAs
- Stronger page enter animations + coach typing dots
- Mobile-friendly touch targets (44px), safe-area padding, sticky glass header

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
