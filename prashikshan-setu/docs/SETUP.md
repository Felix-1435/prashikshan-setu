# PrashikshanSetu — Setup Guide (SIH 2026)

## 1. Neon.tech (PostgreSQL)

1. Go to https://neon.tech → Sign up / Log in  
2. **Create project** → name: `prashikshan-setu`  
3. Leave **Neon Auth OFF**  
4. Copy the connection string (`DATABASE_URL`)  
5. Tables + demo users are created automatically on first API start  

---

## 2. OpenRouter (AI — free models)

1. Go to https://openrouter.ai → Sign up  
2. **Keys** → Create key  
3. Put in server env:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
   ```
4. If rate-limited, try:
   - `meta-llama/llama-3.2-3b-instruct:free`
   - `qwen/qwen-2.5-7b-instruct:free`

---

## 3. GitHub

1. Create repo `prashikshan-setu`  
2. Upload project so root contains `server/` and `web/`  

---

## 4. Render (API)

1. https://render.com → New → **Web Service** → connect repo  
2. Settings:
   - **Name:** `prashikshan-setu-api`
   - **Root Directory:** `server`
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`
   - **Plan:** Free  
3. Environment:
   - `DATABASE_URL` = Neon URI  
   - `OPENROUTER_API_KEY` = your key  
   - `OPENROUTER_MODEL` = free model id  
   - `FRONTEND_URL` = your Vercel URL (set after step 5)  
   - `NODE_ENV` = `production`  
4. Deploy → open `https://<your-api>.onrender.com/api/health`  

---

## 5. Vercel (Web)

1. https://vercel.com → New Project → import `prashikshan-setu`  
2. **Root Directory:** `web`  
3. Framework: Vite  
4. Env:
   - `VITE_API_URL` = Render URL **without** trailing slash  
5. Deploy → copy Vercel URL  
6. Return to Render → set `FRONTEND_URL` to that Vercel URL → save (redeploy)  

---

## 6. Open the app

Vercel URL → login:

- `trainee01` / `Train@123`  
- `coord01` / `Coord@123`  
- `admin` / `Admin@123`  

Free Render may sleep; hit `/api/health` once if login fails, then retry.

---

## 7. Supabase (optional instead of Neon)

Use Supabase Postgres connection URI as `DATABASE_URL`. Auth/Storage not required for SIH demo.
