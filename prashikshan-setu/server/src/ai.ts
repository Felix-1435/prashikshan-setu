/**
 * OpenRouter multi-model cascade + local knowledge-base fallback.
 * Flow: Model 1 → Model 2 → expanded offlineCoach (acts as local/DB responder).
 * Free models preferred for SIH demo.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Ordered model list. Override with env OPENROUTER_MODELS=model1,model2 */
function getModelCascade(): string[] {
  const fromEnv = (process.env.OPENROUTER_MODELS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (fromEnv.length >= 1) return fromEnv;
  // Primary + secondary (good free options as of 2025/2026)
  return [
    process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.2-3b-instruct:free",
  ];
}

export type Mcq = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: "A" | "B" | "C" | "D";
  explanation: string;
};

async function callOpenRouter(
  model: string,
  key: string,
  messages: { role: string; content: string }[],
  temperature = 0.5,
): Promise<string | null> {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL || "https://prashikshan-setu.local",
        "X-Title": "PrashikshanSetu SIH26101",
      },
      body: JSON.stringify({ model, messages, temperature }),
    });
    if (!res.ok) {
      console.error(`OpenRouter ${model} error`, res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch (e) {
    console.error(`OpenRouter ${model} failed`, e);
    return null;
  }
}

export async function generateMcqsFromText(
  text: string,
  count = 8,
): Promise<{ questions: Mcq[]; source: "openrouter" | "fallback" }> {
  const key = process.env.OPENROUTER_API_KEY || "";
  const models = getModelCascade();
  const clipped = text.slice(0, 12000);

  if (!key || key.includes("replace")) {
    return { questions: fallbackMcqs(clipped, count), source: "fallback" };
  }

  const system = `You are an assessment designer for India's Official Statistical System (MoSPI / NSSTA training).
Generate exactly ${count} multiple-choice questions from the learning material.
Return ONLY valid JSON array, no markdown fences. Each item:
{"question":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","correct":"A|B|C|D","explanation":"..."}
Rules: one correct answer; options plausible; explanations short; language clear for government trainees.
Vary question angles each run; do not reuse the same stems. Mix conceptual and applied items. Variation: ${Date.now() % 997}.`;

  const messages = [
    { role: "system", content: system },
    { role: "user", content: `Learning material:\n\n${clipped}` },
  ];

  for (const model of models.slice(0, 2)) {
    const raw = await callOpenRouter(model, key, messages, 0.7);
    if (!raw) continue;
    try {
      const jsonStr = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr) as Mcq[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          questions: parsed.slice(0, count).map(normalizeMcq),
          source: "openrouter",
        };
      }
    } catch {
      console.error("MCQ parse failed for model", model);
    }
  }

  return { questions: fallbackMcqs(clipped, count), source: "fallback" };
}

export async function chatTutor(
  message: string,
  context: string,
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY || "";
  const models = getModelCascade();

  // No key → go straight to local knowledge base
  if (!key || key.includes("replace")) {
    return offlineCoach(message, context);
  }

  const systemPrompt =
    "You are PrashikshanSetu Coach for MoSPI / NSSTA trainees. Be concise, practical, and focused on Official Statistics competencies, survey methodology, sampling, data quality, SDG indicators, iGOT Karmayogi, and Python/SQL for statistical work. " +
    "Answer general questions politely (identity, creator, greetings) then gently steer back to learning if appropriate. Do not invent ministry policies or confidential data. Keep answers under ~220 words unless the learner asks for a detailed plan.";

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Learner context (gaps / profile):\n${context || "none"}\n\nQuestion:\n${message}`,
    },
  ];

  // Try up to 2 remote models
  for (const model of models.slice(0, 2)) {
    const reply = await callOpenRouter(model, key, messages, 0.5);
    if (reply && reply.length > 8) {
      return reply;
    }
  }

  // Both remote models failed → local knowledge-base responder
  return offlineCoach(message, context);
}

function normalizeMcq(q: Partial<Mcq>): Mcq {
  const correct = String(q.correct || "A").toUpperCase().slice(0, 1);
  return {
    question: String(q.question || "Question"),
    optionA: String(q.optionA || (q as any).option_a || "Option A"),
    optionB: String(q.optionB || (q as any).option_b || "Option B"),
    optionC: String(q.optionC || (q as any).option_c || "Option C"),
    optionD: String(q.optionD || (q as any).option_d || "Option D"),
    correct: (["A", "B", "C", "D"].includes(correct) ? correct : "A") as Mcq["correct"],
    explanation: String(q.explanation || ""),
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fallbackMcqs(text: string, count: number): Mcq[] {
  const snippet = text.replace(/\s+/g, " ").trim().slice(0, 80) || "official statistics training";
  const base: Mcq[] = [
    {
      question: `Which domain is central to capacity building in India's Official Statistical System?`,
      optionA: "Survey design and sampling",
      optionB: "Retail marketing only",
      optionC: "Social media analytics only",
      optionD: "Gaming engines",
      correct: "A",
      explanation: "Survey design and sampling are core statistical competencies for MoSPI/NSO work.",
    },
    {
      question: `What is a practical first step after a skill-gap is identified?`,
      optionA: "Ignore it until next year",
      optionB: "Study a short focused module and take a practice quiz",
      optionC: "Delete all competency records",
      optionD: "Change only the username",
      correct: "B",
      explanation: "Targeted study + assessment closes gaps faster than passive waiting.",
    },
    {
      question: `iGOT Karmayogi is primarily used for:`,
      optionA: "Personal entertainment streaming",
      optionB: "Government capacity-building courses and learning pathways",
      optionC: "Stock market day trading",
      optionD: "To store passwords in plain text",
      correct: "B",
      explanation: "iGOT provides shared course inventory and progress signals for government learners.",
    },
    {
      question: `A useful technical skill for processing large statistical datasets is:`,
      optionA: "SQL",
      optionB: "Calligraphy",
      optionC: "Analog film editing",
      optionD: "Hand typesetting",
      correct: "A",
      explanation: "SQL is fundamental for database-backed statistical production.",
    },
    {
      question: `Cybersecurity awareness for statistical officers mainly reduces risk of:`,
      optionA: "Faster sampling",
      optionB: "Unauthorized access and data breaches",
      optionC: "Higher GDP estimates",
      optionD: "More survey questions",
      correct: "B",
      explanation: "Protecting microdata and systems is a digital governance competency.",
    },
    {
      question: `SDG indicators in official statistics are used to:`,
      optionA: "Track sustainable development progress with standardized metrics",
      optionB: "Replace the census permanently",
      optionC: "Hide regional disparities",
      optionD: "Automate only social media posts",
      correct: "A",
      explanation: "SDG monitoring relies on credible official statistics.",
    },
    {
      question: `Material reference in this assessment relates to:`,
      optionA: snippet,
      optionB: "Unrelated entertainment content",
      optionC: "Private banking product ads",
      optionD: "Sports league rankings only",
      correct: "A",
      explanation: "Questions are grounded in the uploaded training material.",
    },
  ];
  return shuffle(base).slice(0, Math.max(3, Math.min(count, base.length)));
}

/**
 * Local knowledge-base style responder (used after 2 remote models fail,
 * or when no API key). Covers general conversation + domain topics.
 * Think of this as the "database of general conversations + training FAQs".
 */
function offlineCoach(message: string, context: string): string {
  const m = (message || "").toLowerCase().trim();
  const gapLines = (context || "")
    .split(/\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  const gapHint = gapLines.length
    ? "Your recorded gaps include: " + gapLines.slice(0, 4).join("; ") + "."
    : "Open your Competency map to prioritise gaps.";

  // --- General / identity / conversation ---
  if (!m || m === "hi" || m === "hello" || m === "hey" || m.startsWith("namaste") || m === "good morning" || m === "good evening") {
    return (
      "Namaste. I am the PrashikshanSetu coach for Official Statistics capacity building (MoSPI / NSSTA style training).\n\n" +
      "Ask me something specific, for example:\n" +
      "• How do I improve sampling methods?\n" +
      "• What iGOT course helps with Python for survey data?\n" +
      "• Explain stratified vs cluster sampling\n" +
      "• How to close my data quality gaps?\n\n" +
      gapHint
    );
  }

  if (/(who made you|who created you|who built you|who are you|what are you|your creator|made by|developed by)/.test(m)) {
    return (
      "I am PrashikshanSetu Coach — an AI assistant built for the PrashikshanSetu platform (SIH problem statement focused on MoSPI / NSSTA capacity building).\n\n" +
      "I help trainees with survey methodology, sampling, data quality, SDG indicators, iGOT pathways, and practical next steps from their competency gaps.\n\n" +
      "When online models are unavailable I answer from a local knowledge base of training FAQs and general conversation patterns.\n\n" +
      gapHint
    );
  }

  if (/(thank|thanks|thx|ok thanks|got it)/.test(m)) {
    return "You're welcome. When you're ready, pick one gap, study a short module, then request a practice quiz from your unit notes. I can help refine the study plan anytime.";
  }

  if (/(how are you|how's it going|are you ok)/.test(m)) {
    return "I'm functioning well and ready to help with Official Statistics learning. What competency or topic would you like to work on today?";
  }

  if (/(help|what can you do|capabilities|features)/.test(m)) {
    return (
      "I can help with:\n" +
      "1. Sampling methods, survey design, SDG indicators, data quality frameworks\n" +
      "2. Practical micro-plans (Python/pandas, SQL for statistical DBs)\n" +
      "3. Mapping your open gaps to iGOT / NSSTA style next steps\n" +
      "4. Guiding coordinators on generating quizzes from unit notes\n\n" +
      "Try a concrete question such as \"How do I improve sampling methods?\""
    );
  }

  // --- Domain topics ---
  if (/(sampl|srs|stratified|cluster|nssta|survey design)/.test(m)) {
    return (
      "Sampling methods — practical path:\n" +
      "1. Revise SRS vs stratified vs cluster and when each reduces variance.\n" +
      "2. Work one NSSTA-style exercise: allocate sample across strata with cost constraints.\n" +
      "3. On iGOT Karmayogi, search foundation modules on sample surveys / survey operations.\n" +
      "4. After study, ask your coordinator to generate a quiz from your unit notes.\n\n" +
      gapHint
    );
  }
  if (/(python|pandas|coding|script)/.test(m)) {
    return (
      "Python for statistical work — 2-week micro-plan:\n" +
      "Days 1–3: pandas read_csv, filters, groupby on a small microdata extract.\n" +
      "Days 4–6: missing values, merge of household & member files.\n" +
      "Days 7–10: simple charts (bar/line) for indicator checks.\n" +
      "Pair with iGOT-style Python for Data Analysis modules, then request a practice quiz.\n\n" +
      gapHint
    );
  }
  if (/(sql|database|query)/.test(m)) {
    return (
      "SQL for statistical databases:\n" +
      "Focus on SELECT, JOIN, GROUP BY, and window functions for weighted indicators.\n" +
      "Practice reconstructing a district aggregate from unit-level tables.\n" +
      "Recommended next: SQL intermediate modules on iGOT, then coordinator-led assessment.\n\n" +
      gapHint
    );
  }
  if (/(sdg|indicator|quality|dqaf|data quality)/.test(m)) {
    return (
      "Data quality & indicators:\n" +
      "Use the classic pillars — relevance, accuracy, timeliness, accessibility, coherence.\n" +
      "For each open gap, write one control check (e.g. range, consistency across waves).\n" +
      "Study SDG indicator framework notes, then generate MCQs from those notes in Build quiz.\n\n" +
      gapHint
    );
  }
  if (/(igot|karmayogi|nssta|course|training)/.test(m)) {
    return (
      "Training pathway tip:\n" +
      "Open Learning path in PrashikshanSetu for ranked recommendations, then open https://igotkarmayogi.gov.in to search the matching topic.\n" +
      "NSSTA TPAC intensives suit advanced survey operations; iGOT foundation suits domain gaps.\n\n" +
      gapHint
    );
  }
  if (/(cyber|privacy|dpdp|digital)/.test(m)) {
    return (
      "Digital governance focus:\n" +
      "Complete cybersecurity awareness + DPDP basics, then apply a checklist to any microdata share (purpose, access log, anonymisation).\n\n" +
      gapHint
    );
  }

  // Default guided response
  return (
    "Here is a concrete next step: pick your highest-severity gap, study one short module on that topic, then take or request a practice quiz from your notes.\n\n" +
    "You asked about: \"" + message.slice(0, 120) + "\".\n" +
    gapHint +
    "\n\nTry a more specific question (sampling, Python, SQL, SDG, iGOT, or \"who made you\") for a detailed answer. " +
    "If remote AI models are rate-limited, this local knowledge base still answers common training and general questions."
  );
}
