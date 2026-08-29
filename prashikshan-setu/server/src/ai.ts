/**
 * OpenRouter client — free models preferred for SIH demo.
 * Fallback returns deterministic MCQs if key missing or API fails.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type Mcq = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: "A" | "B" | "C" | "D";
  explanation: string;
};

export async function generateMcqsFromText(
  text: string,
  count = 8,
): Promise<{ questions: Mcq[]; source: "openrouter" | "fallback" }> {
  const key = process.env.OPENROUTER_API_KEY || "";
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
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

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL || "https://prashikshan-setu.local",
        "X-Title": "PrashikshanSetu SIH26101",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Learning material:\n\n${clipped}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error("OpenRouter error", res.status, await res.text());
      return { questions: fallbackMcqs(clipped, count), source: "fallback" };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content || "[]";
    const jsonStr = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr) as Mcq[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { questions: fallbackMcqs(clipped, count), source: "fallback" };
    }
    return {
      questions: parsed.slice(0, count).map(normalizeMcq),
      source: "openrouter",
    };
  } catch (e) {
    console.error("generateMcqs failed", e);
    return { questions: fallbackMcqs(clipped, count), source: "fallback" };
  }
}

export async function chatTutor(
  message: string,
  context: string,
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY || "";
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

  if (!key || key.includes("replace")) {
    return (
      "I can help you close competency gaps in Official Statistics. " +
      "Focus on the skills marked high severity on your map, then take the recommended iGOT modules. " +
      `(Context: ${context.slice(0, 200) || "no open gaps listed"})`
    );
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL || "https://prashikshan-setu.local",
        "X-Title": "PrashikshanSetu SIH26101",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are PrashikshanSetu Coach for MoSPI trainees. Be concise, practical, and focused on Official Statistics competencies and iGOT learning. Do not invent ministry policies.",
          },
          {
            role: "user",
            content: `Learner context:\n${context}\n\nQuestion:\n${message}`,
          },
        ],
        temperature: 0.5,
      }),
    });
    if (!res.ok) {
      return offlineCoach(message, context);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content || "No response.";
  } catch {
    return offlineCoach(message, context);
  }
}

function normalizeMcq(q: Partial<Mcq>): Mcq {
  const correct = String(q.correct || "A").toUpperCase().slice(0, 1);
  return {
    question: String(q.question || "Question"),
    optionA: String(q.optionA || q.option_a || "Option A"),
    optionB: String(q.optionB || q.option_b || "Option B"),
    optionC: String(q.optionC || q.option_c || "Option C"),
    optionD: String(q.optionD || q.option_d || "Option D"),
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
      optionA: "Ignore until annual review",
      optionB: "Take a targeted course on iGOT Karmayogi / NSSTA pathway",
      optionC: "Change designation immediately",
      optionD: "Disable analytics",
      correct: "B",
      explanation: "Personalized pathways on iGOT/NSSTA close gaps efficiently.",
    },
    {
      question: `Data quality frameworks in official statistics primarily help to:`,
      optionA: "Increase survey non-response deliberately",
      optionB: "Ensure reliability, relevance and accuracy of published indicators",
      optionC: "Replace field staff",
      optionD: "Remove metadata",
      correct: "B",
      explanation: "Quality frameworks protect credibility of official indicators.",
    },
    {
      question: `Why integrate learning systems with iGOT Karmayogi?`,
      optionA: "To avoid all assessments",
      optionB: "To reuse national course catalogues and track completion against competencies",
      optionC: "To block departmental training",
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

  if (!m || m === "hi" || m === "hello" || m === "hey" || m.startsWith("namaste")) {
    return (
      "Namaste. I am the PrashikshanSetu coach for Official Statistics capacity building.\n\n" +
      "Ask me something specific, for example:\n" +
      "• How do I improve sampling methods?\n" +
      "• What iGOT course helps with Python for survey data?\n" +
      "• Steps to close a data-quality gap\n\n" +
      gapHint
    );
  }
  if (/(sampl|survey design|stratified|srs)/.test(m)) {
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
      "Complete cybersecurity awareness + DPDP basics, then apply a checklist to any microdata share (purpose, access log, anonymisation).\n" +
      gapHint
    );
  }
  return (
    "Here is a concrete next step: pick your highest-severity gap, study one short module on that topic, then take or request a practice quiz from your notes.\n\n" +
    "You asked about: \"" + message.slice(0, 120) + "\".\n" +
    gapHint +
    "\n\nTry a more specific question (sampling, Python, SQL, SDG, iGOT) for a detailed plan."
  );
}
