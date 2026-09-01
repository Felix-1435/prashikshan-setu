import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

export async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'trainee',
      designation TEXT DEFAULT '',
      department TEXT DEFAULT '',
      email TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS competency_scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      domain TEXT NOT NULL,
      skill TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      target INTEGER NOT NULL DEFAULT 80,
      UNIQUE(user_id, domain, skill)
    );

    CREATE TABLE IF NOT EXISTS gaps (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      domain TEXT NOT NULL,
      skill TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'open',
      note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS igot_courses (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      domain TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'foundation',
      hours INTEGER DEFAULT 4,
      provider TEXT DEFAULT 'iGOT Karmayogi',
      url TEXT DEFAULT '',
      description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES igot_courses(id) ON DELETE CASCADE,
      reason TEXT DEFAULT '',
      status TEXT DEFAULT 'suggested',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      uploaded_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      domain TEXT DEFAULT '',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct TEXT NOT NULL,
      explanation TEXT DEFAULT '',
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      answers JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Safe migrations for existing Neon DBs
  await pool.query(`ALTER TABLE igot_courses ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`);

  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM users`);
  if (rows[0].c === 0) {
    await seed();
  } else {
    await syncDemoProfiles();
  }
  // Always keep course catalogue fresh (idempotent upsert)
  await upsertCourses();
}

/** Update primary demo names and insert any missing trainee accounts (safe on Neon). */
async function syncDemoProfiles() {
  const desired: [string, string, string, string, string, string, string][] = [
    ["trainee01", "Train@123", "Felix Shiju", "trainee", "Statistical Investigator", "NSO Field Ops", "felix@mospi.demo"],
    ["trainee02", "Train@123", "Rahul Mehta", "trainee", "Junior Statistical Officer", "Price Statistics", "rahul@mospi.demo"],
    ["trainee03", "Train@123", "Sneha Iyer", "trainee", "Field Enumerator Lead", "Survey Ops", "sneha@mospi.demo"],
    ["trainee04", "Train@123", "Vikram Singh", "trainee", "Data Processing Assistant", "Computer Centre", "vikram@mospi.demo"],
    ["trainee05", "Train@123", "Ananya Krishnan", "trainee", "Statistical Assistant", "Social Statistics", "ananya@mospi.demo"],
    ["trainee06", "Train@123", "Arjun Nair", "trainee", "Junior Statistical Officer", "Industrial Statistics", "arjun@mospi.demo"],
    ["coord01", "Coord@123", "Shivangi", "coordinator", "Training Coordinator", "DIID / NSSTA", "shivangi@mospi.demo"],
    ["coord02", "Coord@123", "Amit Desai", "coordinator", "Regional Training Officer", "NSSTA West", "amit@mospi.demo"],
    ["admin", "Admin@123", "System Admin", "admin", "Platform Admin", "DIID", "admin@mospi.demo"],
  ];

  for (const u of desired) {
    const [username, password, name, role, designation, department, email] = u;
    const { rows } = await pool.query(`SELECT id FROM users WHERE username = $1`, [username]);
    if (rows[0]) {
      await pool.query(
        `UPDATE users SET name = $2, role = $3, designation = $4, department = $5, email = $6, password = $7 WHERE username = $1`,
        [username, name, role, designation, department, email, password],
      );
    } else {
      const ins = await pool.query(
        `INSERT INTO users (username, password, name, role, designation, department, email)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [username, password, name, role, designation, department, email],
      );
      if (role === "trainee") {
        await seedCompetenciesForUser(ins.rows[0].id);
      }
    }
  }
}

const COURSE_CATALOGUE: [string, string, string, string, number, string, string][] = [
  ["IGOT-STAT-101", "Fundamentals of Sample Surveys", "Statistical", "foundation", 8, "iGOT Karmayogi", "Core sampling theory for official statistics officers."],
  ["IGOT-STAT-115", "CAPI & Digital Data Collection", "Statistical", "foundation", 6, "iGOT Karmayogi", "Mobile-assisted personal interviewing for field staff."],
  ["IGOT-STAT-210", "National Accounts & Macro Indicators", "Statistical", "intermediate", 12, "iGOT Karmayogi", "GDP, GVA and national accounts compilation basics."],
  ["IGOT-STAT-220", "Price Statistics & CPI Construction", "Statistical", "intermediate", 10, "iGOT Karmayogi", "Consumer price index methodology and field price collection."],
  ["IGOT-STAT-305", "SDG Indicator Framework for Official Statistics", "Statistical", "intermediate", 6, "iGOT Karmayogi", "Mapping SDG indicators to MoSPI statistical products."],
  ["IGOT-STAT-320", "Stratified & Cluster Sampling in NSS", "Statistical", "advanced", 10, "iGOT Karmayogi", "Design effects, PSU selection and variance estimation."],
  ["NSSTA-TPAC-01", "NSSTA TPAC: Survey Operations Intensive", "Statistical", "advanced", 20, "NSSTA", "Residential workshop on end-to-end survey operations."],
  ["NSSTA-TPAC-02", "NSSTA TPAC: Price Statistics Workshop", "Statistical", "intermediate", 12, "NSSTA", "Hands-on CPI / WPI compilation and validation."],
  ["NSSTA-TPAC-03", "NSSTA TPAC: PLFS Field Supervision", "Statistical", "advanced", 15, "NSSTA", "Periodic Labour Force Survey supervision protocols."],
  ["IGOT-TECH-120", "Python for Data Analysis", "Technical", "foundation", 10, "iGOT Karmayogi", "Pandas and basic scripting for statistical workflows."],
  ["IGOT-TECH-140", "Excel & R for Official Statistics", "Technical", "foundation", 8, "iGOT Karmayogi", "Practical spreadsheet and R skills for analysts."],
  ["IGOT-TECH-220", "SQL for Statistical Databases", "Technical", "intermediate", 8, "iGOT Karmayogi", "Querying survey microdata and metadata stores."],
  ["IGOT-TECH-250", "Data Visualization for Policy Briefs", "Technical", "intermediate", 6, "iGOT Karmayogi", "Charts and dashboards that communicate statistical findings."],
  ["IGOT-TECH-310", "Introduction to Machine Learning for Public Data", "Technical", "advanced", 14, "iGOT Karmayogi", "Supervised learning patterns on anonymised public datasets."],
  ["IGOT-DIG-110", "Cybersecurity Essentials for Government", "Digital Governance", "foundation", 5, "iGOT Karmayogi", "Threat awareness for statistical offices."],
  ["IGOT-DIG-150", "e-Office & Digital Workflow Basics", "Digital Governance", "foundation", 4, "iGOT Karmayogi", "Paperless processes in central ministries."],
  ["IGOT-DIG-205", "Data Protection & Privacy (DPDP)", "Digital Governance", "intermediate", 6, "iGOT Karmayogi", "Digital Personal Data Protection Act applied to surveys."],
  ["IGOT-DIG-230", "Open Data & API Dissemination", "Digital Governance", "intermediate", 5, "iGOT Karmayogi", "Publishing official statistics as open data."],
  ["IGOT-BEH-101", "Project Management for Public Sector", "Behavioural", "foundation", 6, "iGOT Karmayogi", "Planning and delivery of training and survey projects."],
  ["IGOT-BEH-150", "Effective Communication for Officers", "Behavioural", "foundation", 4, "iGOT Karmayogi", "Briefing seniors and writing clear statistical notes."],
  ["IGOT-BEH-180", "Citizen-Centric Service Delivery", "Behavioural", "foundation", 4, "iGOT Karmayogi", "Behavioural competencies for field interaction."],
  ["IGOT-BEH-210", "Leadership in Statistical Organisations", "Behavioural", "intermediate", 8, "iGOT Karmayogi", "Leading teams across FOD, NAD and state DES."],
];

export async function upsertCourses() {
  for (const c of COURSE_CATALOGUE) {
    const [code, title, domain, level, hours, provider, description] = c;
    await pool.query(
      `INSERT INTO igot_courses (code, title, domain, level, hours, provider, url, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (code) DO UPDATE SET
         title = EXCLUDED.title,
         domain = EXCLUDED.domain,
         level = EXCLUDED.level,
         hours = EXCLUDED.hours,
         provider = EXCLUDED.provider,
         description = EXCLUDED.description`,
      [code, title, domain, level, hours, provider, "https://igotkarmayogi.gov.in", description],
    );
  }
  console.log("[prashikshan-setu] iGOT / NSSTA course catalogue synced");
}

const SKILL_TEMPLATE: [string, string, number, number][] = [
  ["Statistical", "Sample Survey Design", 42, 80],
  ["Statistical", "CAPI / Mobile Data Collection", 38, 80],
  ["Statistical", "National Accounts", 55, 80],
  ["Statistical", "Price Statistics", 48, 80],
  ["Technical", "Python / R Scripting", 35, 75],
  ["Technical", "SQL & Databases", 40, 80],
  ["Technical", "Data Visualization", 50, 75],
  ["Technical", "AI / ML Basics", 28, 70],
  ["Digital Governance", "Cybersecurity Awareness", 60, 80],
  ["Digital Governance", "Data Privacy", 52, 80],
  ["Behavioural", "Project Management", 65, 80],
  ["Behavioural", "Communication", 70, 80],
];

async function seedCompetenciesForUser(userId: number) {
  for (const [domain, skill, score, target] of SKILL_TEMPLATE) {
    const s = Math.max(20, Math.min(90, Number(score) + (userId % 3) * 5 - 5));
    await pool.query(
      `INSERT INTO competency_scores (user_id, domain, skill, score, target) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, domain, skill) DO NOTHING`,
      [userId, domain, skill, s, target],
    );
    if (s < Number(target) - 15) {
      await pool.query(
        `INSERT INTO gaps (user_id, domain, skill, severity, note)
         SELECT $1,$2,$3,$4,$5
         WHERE NOT EXISTS (
           SELECT 1 FROM gaps WHERE user_id = $1 AND domain = $2 AND skill = $3 AND status = 'open'
         )`,
        [
          userId,
          domain,
          skill,
          s < 40 ? "high" : "medium",
          `Below target for ${skill}. Recommended structured learning.`,
        ],
      );
    }
  }
}

async function seed() {
  const users: [string, string, string, string, string, string, string][] = [
    ["trainee01", "Train@123", "Felix Shiju", "trainee", "Statistical Investigator", "NSO Field Ops", "felix@mospi.demo"],
    ["trainee02", "Train@123", "Rahul Mehta", "trainee", "Junior Statistical Officer", "Price Statistics", "rahul@mospi.demo"],
    ["trainee03", "Train@123", "Sneha Iyer", "trainee", "Field Enumerator Lead", "Survey Ops", "sneha@mospi.demo"],
    ["trainee04", "Train@123", "Vikram Singh", "trainee", "Data Processing Assistant", "Computer Centre", "vikram@mospi.demo"],
    ["trainee05", "Train@123", "Ananya Krishnan", "trainee", "Statistical Assistant", "Social Statistics", "ananya@mospi.demo"],
    ["trainee06", "Train@123", "Arjun Nair", "trainee", "Junior Statistical Officer", "Industrial Statistics", "arjun@mospi.demo"],
    ["coord01", "Coord@123", "Shivangi", "coordinator", "Training Coordinator", "DIID / NSSTA", "shivangi@mospi.demo"],
    ["coord02", "Coord@123", "Amit Desai", "coordinator", "Regional Training Officer", "NSSTA West", "amit@mospi.demo"],
    ["admin", "Admin@123", "System Admin", "admin", "Platform Admin", "DIID", "admin@mospi.demo"],
  ];

  const trainees: { id: number }[] = [];
  for (const u of users) {
    const { rows } = await pool.query(
      `INSERT INTO users (username, password, name, role, designation, department, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, role`,
      u,
    );
    if (rows[0].role === "trainee") trainees.push({ id: rows[0].id });
  }

  for (const t of trainees) {
    await seedCompetenciesForUser(t.id);
  }

  await upsertCourses();
  console.log("[prashikshan-setu] Demo data seeded");
}

/**
 * After a quiz attempt, boost competency scores linked to the quiz domain
 * and close gaps when the trainee reaches / exceeds target.
 */
export async function applyQuizCompetencyBoost(
  userId: number,
  quizDomain: string,
  percentage: number,
): Promise<{ updatedSkills: string[]; closedGaps: string[] }> {
  const updatedSkills: string[] = [];
  const closedGaps: string[] = [];
  if (!userId || percentage < 40) return { updatedSkills, closedGaps };

  const domainKey = (() => {
    const d = (quizDomain || "").toLowerCase();
    if (d.includes("stat") || d.includes("survey") || d.includes("sample") || d.includes("nss") || d.includes("price") || d.includes("capi") || d.includes("training"))
      return "Statistical";
    if (d.includes("tech") || d.includes("python") || d.includes("sql") || d.includes("data") || d.includes("ml") || d.includes("r "))
      return "Technical";
    if (d.includes("digital") || d.includes("cyber") || d.includes("privacy") || d.includes("dpdp") || d.includes("governance"))
      return "Digital Governance";
    if (d.includes("behav") || d.includes("soft") || d.includes("comm") || d.includes("project") || d.includes("leader"))
      return "Behavioural";
    return "Statistical";
  })();

  const boost = percentage >= 90 ? 18 : percentage >= 75 ? 12 : percentage >= 60 ? 8 : 5;

  const { rows: skills } = await pool.query(
    `SELECT id, skill, score, target FROM competency_scores
     WHERE user_id = $1 AND domain = $2`,
    [userId, domainKey],
  );

  for (const sk of skills) {
    const newScore = Math.min(100, Number(sk.score) + boost);
    if (newScore === Number(sk.score)) continue;
    await pool.query(`UPDATE competency_scores SET score = $1 WHERE id = $2`, [newScore, sk.id]);
    updatedSkills.push(`${domainKey} / ${sk.skill} → ${newScore}%`);

    if (newScore >= Number(sk.target)) {
      const closed = await pool.query(
        `UPDATE gaps SET status = 'closed', note = COALESCE(note,'') || ' Closed after quiz (' || $3 || '%).'
         WHERE user_id = $1 AND domain = $2 AND skill = $4 AND status = 'open'
         RETURNING skill`,
        [userId, domainKey, percentage, sk.skill],
      );
      for (const g of closed.rows) closedGaps.push(g.skill);
    } else if (newScore < Number(sk.target) - 15) {
      await pool.query(
        `UPDATE gaps SET severity = $3
         WHERE user_id = $1 AND domain = $2 AND skill = $4 AND status = 'open'`,
        [userId, domainKey, newScore < 40 ? "high" : "medium", sk.skill],
      );
    }
  }

  return { updatedSkills, closedGaps };
}
