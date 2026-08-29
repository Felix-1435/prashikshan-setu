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
      url TEXT DEFAULT ''
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

  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM users`);
  if (rows[0].c === 0) await seed();
}

async function seed() {
  const users = [
    ["trainee01", "Train@123", "Anita Sharma", "trainee", "Statistical Investigator", "NSO Field Ops", "anita@mospi.demo"],
    ["trainee02", "Train@123", "Rahul Mehta", "trainee", "Junior Statistical Officer", "Price Statistics", "rahul@mospi.demo"],
    ["trainee03", "Train@123", "Sneha Iyer", "trainee", "Field Enumerator Lead", "Survey Ops", "sneha@mospi.demo"],
    ["trainee04", "Train@123", "Vikram Singh", "trainee", "Data Processing Assistant", "Computer Centre", "vikram@mospi.demo"],
    ["coord01", "Coord@123", "Dr. Priya Nair", "coordinator", "Training Coordinator", "DIID / NSSTA", "priya@mospi.demo"],
    ["coord02", "Coord@123", "Amit Desai", "coordinator", "Regional Training Officer", "NSSTA West", "amit@mospi.demo"],
    ["admin", "Admin@123", "System Admin", "admin", "Platform Admin", "DIID", "admin@mospi.demo"],
  ];
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (username, password, name, role, designation, department, email) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      u,
    );
  }

  const { rows: trainees } = await pool.query(`SELECT id FROM users WHERE role = 'trainee'`);
  const skills = [
    ["Statistical", "Survey Design", 55, 80],
    ["Statistical", "Sampling Methods", 48, 80],
    ["Statistical", "SDG Indicators", 62, 80],
    ["Statistical", "Data Quality Frameworks", 40, 80],
    ["Technical", "Python", 35, 75],
    ["Technical", "SQL", 58, 80],
    ["Technical", "Data Visualization", 50, 75],
    ["Technical", "AI / ML Basics", 28, 70],
    ["Digital Governance", "Cybersecurity Awareness", 60, 80],
    ["Digital Governance", "Data Privacy", 52, 80],
    ["Behavioural", "Project Management", 65, 80],
    ["Behavioural", "Communication", 70, 80],
  ];
  for (const t of trainees) {
    for (const [domain, skill, score, target] of skills) {
      const s = Number(score) + (t.id % 3) * 5 - 5;
      await pool.query(
        `INSERT INTO competency_scores (user_id, domain, skill, score, target) VALUES ($1,$2,$3,$4,$5)`,
        [t.id, domain, skill, Math.max(20, Math.min(90, s)), target],
      );
      if (s < Number(target) - 15) {
        await pool.query(
          `INSERT INTO gaps (user_id, domain, skill, severity, note) VALUES ($1,$2,$3,$4,$5)`,
          [
            t.id,
            domain,
            skill,
            s < 40 ? "high" : "medium",
            `Below target for ${skill}. Recommended structured learning.`,
          ],
        );
      }
    }
  }

  const courses = [
    ["IGOT-STAT-101", "Fundamentals of Sample Surveys", "Statistical", "foundation", 8],
    ["IGOT-STAT-210", "National Accounts & Macro Indicators", "Statistical", "intermediate", 12],
    ["IGOT-STAT-305", "SDG Indicator Framework for Official Statistics", "Statistical", "intermediate", 6],
    ["IGOT-TECH-120", "Python for Data Analysis", "Technical", "foundation", 10],
    ["IGOT-TECH-220", "SQL for Statistical Databases", "Technical", "intermediate", 8],
    ["IGOT-TECH-310", "Introduction to Machine Learning for Public Data", "Technical", "advanced", 14],
    ["IGOT-DIG-110", "Cybersecurity Essentials for Government", "Digital Governance", "foundation", 5],
    ["IGOT-DIG-205", "Data Protection & Privacy (DPDP)", "Digital Governance", "intermediate", 6],
    ["IGOT-BEH-101", "Project Management for Public Sector", "Behavioural", "foundation", 6],
    ["IGOT-BEH-150", "Effective Communication for Officers", "Behavioural", "foundation", 4],
    ["NSSTA-TPAC-01", "NSSTA TPAC: Survey Operations Intensive", "Statistical", "advanced", 20],
    ["NSSTA-TPAC-02", "NSSTA TPAC: Price Statistics Workshop", "Statistical", "intermediate", 12],
  ];
  for (const c of courses) {
    await pool.query(
      `INSERT INTO igot_courses (code, title, domain, level, hours, url) VALUES ($1,$2,$3,$4,$5,$6)`,
      [...c, "https://igotkarmayogi.gov.in"],
    );
  }

  console.log("[prashikshan-setu] Demo data seeded");
}
