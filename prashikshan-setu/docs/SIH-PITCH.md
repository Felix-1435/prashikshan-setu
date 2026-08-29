# PrashikshanSetu — SIH 2026 Pitch Notes (SIH26101)

**Organization:** MoSPI  
**Theme:** Smart Education  
**Category:** Software  

## One-liner
AI training bridge that maps competency gaps for Official Statistics officers, recommends iGOT Karmayogi / NSSTA pathways, and generates MCQs from real training material.

## Problem
Officers struggle to find the right courses on iGOT; no intelligent gap assessment tied to statistical job roles; assessments from material are manual.

## Solution
1. Competency profile (Statistical, Technical, Digital Governance, Behavioural)  
2. Automated skill-gap detection  
3. Personalized recommendations (iGOT-style catalogue + NSSTA TPAC)  
4. Upload / paste notes → LLM generates objective quizzes with feedback  
5. Trainee, coordinator, and admin dashboards  

## Demo (3–4 min)
1. Login `trainee01` → competency map + gaps  
2. Learning path → recommended modules  
3. Login `coord01` → paste material → Generate MCQs  
4. Trainee takes quiz → score + explanations  
5. Admin overview → org gap snapshot  

## Tech
React · Express · PostgreSQL (Neon) · OpenRouter · Vercel · Render  
