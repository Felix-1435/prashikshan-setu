# PrashikshanSetu

**SIH 2026 — Problem Statement SIH26101**  
Ministry of Statistics and Programme Implementation (MoSPI)  
Theme: Smart Education

**AI training bridge for India's Official Statistical System.**  
Identifies competency gaps, recommends personalized pathways from the iGOT Karmayogi ecosystem, and generates MCQs from uploaded learning material for capacity building.

---

## What it does

| Need (PS26101) | PrashikshanSetu |
|---|---|
| Competency assessment | Profile + domain scores (Statistical, Technical, Digital, Behavioural) |
| Skill-gap analysis | Gap map vs role competency targets |
| Personalized training | iGOT-style + NSSTA TPAC recommendations (mock connector, API-ready) |
| MCQs from uploads | Learning material → LLM quiz generation (OpenRouter) |
| Learner dashboard | Gaps, progress, recommended path |
| Admin dashboard | Org-wide competency distribution |
| Secure web app | Role-based access: Trainee / Coordinator / Admin |

---

## Stack

- **Web:** React, TypeScript, Vite, Tailwind  
- **API:** Express, TypeScript  
- **DB:** PostgreSQL (Neon)  
- **AI:** OpenRouter free models (e.g. `google/gemini-2.0-flash-exp:free`)

---

## Demo logins (seeded on first API start)

| Role | Username | Password |
|------|----------|----------|
| Trainee | `trainee01` | `Train@123` |
| Coordinator | `coord01` | `Coord@123` |
| Admin | `admin` | `Admin@123` |

---

## Deploy

See `docs/SETUP.md` for Neon, OpenRouter, Render, and Vercel step-by-step.

---

## SIH notes

- Primary PS: **SIH26101** (MoSPI)  
- Integration surface: iGOT Karmayogi (mock + ready for live APIs)  
- Core demo moment: upload / paste training material → auto MCQs  
