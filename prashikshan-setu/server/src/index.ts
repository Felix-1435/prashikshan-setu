import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool, ensureTables } from "./db.js";
import { generateMcqsFromText, chatTutor } from "./ai.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = [FRONTEND, FRONTEND.replace(/\/$/, ""), "http://localhost:5173", "http://127.0.0.1:5173"];
      if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) return cb(null, true);
      return cb(null, true); // SIH demo: allow browser clients
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  const key = process.env.OPENROUTER_API_KEY || "";
  const models = (process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL || "openrouter/free").slice(0, 120);
  res.json({
    ok: true,
    service: "prashikshan-setu",
    ps: "SIH26101",
    openrouter: {
      keyConfigured: Boolean(key && !key.includes("replace") && key.length > 12),
      modelsHint: models,
    },
  });
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      res.status(400).json({ error: "username and password required" });
      return;
    }
    const { rows } = await pool.query(
      `SELECT id, username, name, role, designation, department, email FROM users WHERE username = $1 AND password = $2`,
      [username, password],
    );
    if (!rows[0]) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/me/:id/dashboard", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows: scores } = await pool.query(
      `SELECT domain, skill, score, target FROM competency_scores WHERE user_id = $1 ORDER BY domain, skill`,
      [id],
    );
    const { rows: gapRows } = await pool.query(
      `SELECT id, domain, skill, severity, status, note, created_at FROM gaps WHERE user_id = $1 AND status = 'open' ORDER BY CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
      [id],
    );
    const byDomain: Record<string, { avg: number; n: number }> = {};
    for (const s of scores) {
      if (!byDomain[s.domain]) byDomain[s.domain] = { avg: 0, n: 0 };
      byDomain[s.domain].avg += s.score;
      byDomain[s.domain].n += 1;
    }
    const domains = Object.entries(byDomain).map(([domain, v]) => ({
      domain,
      average: Math.round(v.avg / v.n),
    }));
    const overall =
      scores.length > 0
        ? Math.round(scores.reduce((a: number, s: { score: number }) => a + s.score, 0) / scores.length)
        : 0;

    res.json({
      overall,
      domains,
      scores,
      openGaps: gapRows.length,
      gaps: gapRows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

/** Personalized path: map open gaps → iGOT / NSSTA courses */
app.get("/api/me/:id/path", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows: gaps } = await pool.query(
      `SELECT domain, skill FROM gaps WHERE user_id = $1 AND status = 'open'`,
      [id],
    );
    const domains = [...new Set(gaps.map((g: { domain: string }) => g.domain))];
    let courses;
    if (domains.length) {
      const { rows } = await pool.query(
        `SELECT * FROM igot_courses WHERE domain = ANY($1) ORDER BY level, title`,
        [domains],
      );
      courses = rows;
    } else {
      const { rows } = await pool.query(`SELECT * FROM igot_courses ORDER BY id LIMIT 6`);
      courses = rows;
    }

    const recommendations = courses.map((c: {
      id: number;
      code: string;
      title: string;
      domain: string;
      level: string;
      hours: number;
      provider: string;
      url: string;
    }) => {
      const related = gaps.filter((g: { domain: string }) => g.domain === c.domain);
      return {
        ...c,
        reason:
          related.length > 0
            ? `Addresses gap(s): ${related.map((g: { skill: string }) => g.skill).join(", ")}`
            : "Foundational module aligned to your role profile",
      };
    });

    res.json({ recommendations, source: "igot-mock+nssta" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Path failed" });
  }
});

app.get("/api/courses", async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM igot_courses ORDER BY domain, title`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Courses failed" });
  }
});

/** Coordinator: paste or upload text → generate quiz */
app.post("/api/materials/quiz", async (req, res) => {
  try {
    const { title, content, userId, count } = req.body as {
      title?: string;
      content?: string;
      userId?: number;
      count?: number;
    };
    const bodyText = (content || "").trim();
    if (bodyText.length < 40) {
      res.status(400).json({ error: "Provide learning material text (min ~40 chars). Plain text only — not .docx/.pdf binary." });
      return;
    }
    // Reject Office/ZIP/PDF binary dumped as "text"
    if (
      bodyText.startsWith("PK") ||
      bodyText.startsWith("%PDF") ||
      bodyText.includes("word/document.xml") ||
      bodyText.includes("[Content_Types].xml")
    ) {
      res.status(400).json({
        error:
          "Content looks like a Word/PDF file, not plain text. Open the document, copy the text, and paste it — or upload a .txt/.md file.",
      });
      return;
    }
    const materialTitle = (title || "Uploaded material").trim();
    const { rows: mat } = await pool.query(
      `INSERT INTO materials (title, content, uploaded_by) VALUES ($1,$2,$3) RETURNING id`,
      [materialTitle, bodyText, userId || null],
    );
    const materialId = mat[0].id;
    const { questions, source } = await generateMcqsFromText(bodyText, count || 8);
    const { rows: quizRows } = await pool.query(
      `INSERT INTO quizzes (material_id, title, domain, created_by) VALUES ($1,$2,$3,$4) RETURNING id`,
      [materialId, `Quiz: ${materialTitle}`, "Training", userId || null],
    );
    const quizId = quizRows[0].id;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await pool.query(
        `INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct, explanation, order_index)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [quizId, q.question, q.optionA, q.optionB, q.optionC, q.optionD, q.correct, q.explanation, i],
      );
    }
    res.status(201).json({
      quizId,
      materialId,
      questionCount: questions.length,
      source,
      questions,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

app.get("/api/quizzes", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.id, q.title, q.domain, q.created_at,
              (SELECT COUNT(*)::int FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count
       FROM quizzes q ORDER BY q.created_at DESC`,
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "List failed" });
  }
});

app.get("/api/quizzes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const forTrainer = String(req.query.trainer || "") === "1";
    const { rows: quiz } = await pool.query(`SELECT * FROM quizzes WHERE id = $1`, [id]);
    if (!quiz[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { rows: questions } = await pool.query(
      `SELECT id, question, option_a AS "optionA", option_b AS "optionB", option_c AS "optionC", option_d AS "optionD",
              correct, explanation, order_index AS "orderIndex"
       FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index`,
      [id],
    );
    const safe = forTrainer
      ? questions
      : questions.map(({ correct: _c, explanation: _e, ...rest }) => rest);
    res.json({ ...quiz[0], questions: safe });
  } catch (e) {
    res.status(500).json({ error: "Load failed" });
  }
});

app.post("/api/quizzes/:id/attempt", async (req, res) => {
  try {
    const quizId = Number(req.params.id);
    const { userId, answers } = req.body as {
      userId?: number;
      answers?: { questionId: number; selected: string }[];
    };
    const { rows: questions } = await pool.query(
      `SELECT id, correct, explanation, question FROM quiz_questions WHERE quiz_id = $1`,
      [quizId],
    );
    let score = 0;
    const detail = questions.map((q: { id: number; correct: string; explanation: string; question: string }) => {
      const picked = answers?.find((a) => a.questionId === q.id)?.selected?.toUpperCase() || "";
      const ok = picked === q.correct;
      if (ok) score += 1;
      return {
        questionId: q.id,
        question: q.question,
        selected: picked,
        correct: q.correct,
        isCorrect: ok,
        explanation: q.explanation,
      };
    });
    const total = questions.length;
    if (userId) {
      await pool.query(
        `INSERT INTO quiz_attempts (quiz_id, user_id, score, total, answers) VALUES ($1,$2,$3,$4,$5)`,
        [quizId, userId, score, total, JSON.stringify(detail)],
      );
    }
    res.json({
      score,
      total,
      percentage: total ? Math.round((score / total) * 100) : 0,
      detail,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Attempt failed" });
  }
});

app.post("/api/coach", async (req, res) => {
  try {
    const { userId, message } = req.body as { userId?: number; message?: string };
    if (!message?.trim()) {
      res.status(400).json({ error: "message required" });
      return;
    }
    let context = "";
    if (userId) {
      const { rows } = await pool.query(
        `SELECT domain, skill, severity FROM gaps WHERE user_id = $1 AND status = 'open' LIMIT 12`,
        [userId],
      );
      context = rows.map((g: { severity: string; domain: string; skill: string }) => `${g.severity}: ${g.domain} / ${g.skill}`).join("\n");
    }
    const reply = await chatTutor(message.trim(), context);
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: "Coach failed" });
  }
});

app.get("/api/admin/overview", async (_req, res) => {
  try {
    const { rows: users } = await pool.query(`SELECT COUNT(*)::int AS c FROM users WHERE role = 'trainee'`);
    const { rows: gaps } = await pool.query(`SELECT COUNT(*)::int AS c FROM gaps WHERE status = 'open'`);
    const { rows: domainAvg } = await pool.query(
      `SELECT domain, ROUND(AVG(score))::int AS average FROM competency_scores GROUP BY domain ORDER BY domain`,
    );
    const { rows: severity } = await pool.query(
      `SELECT severity, COUNT(*)::int AS c FROM gaps WHERE status = 'open' GROUP BY severity`,
    );
    res.json({
      trainees: users[0].c,
      openGaps: gaps[0].c,
      domainAverages: domainAvg,
      gapSeverity: severity,
    });
  } catch (e) {
    res.status(500).json({ error: "Overview failed" });
  }
});


app.get("/api/admin/attempts", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.id, a.score, a.total, a.created_at,
             u.name AS trainee_name, u.username, u.designation,
             q.title AS quiz_title
      FROM quiz_attempts a
      JOIN users u ON u.id = a.user_id
      JOIN quizzes q ON q.id = a.quiz_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Attempts failed" });
  }
});

app.get("/api/me/:id/attempts", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(`
      SELECT a.id, a.quiz_id, a.score, a.total, a.created_at, q.title AS quiz_title
      FROM quiz_attempts a
      JOIN quizzes q ON q.id = a.quiz_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `, [id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL not set — set it in .env (Neon/Supabase)");
  }
  try {
    await ensureTables();
    console.log("[prashikshan-setu] tables ready");
  } catch (e) {
    console.error("[prashikshan-setu] DB init failed — check DATABASE_URL", e);
  }
  app.listen(PORT, () => console.log(`[prashikshan-setu] API on :${PORT}`));
}

main();
