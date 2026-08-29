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
  const m = message.toLowerCase();
  const gaps = context || "Survey Design, Sampling, Python, SQL, Cybersecurity";
  if (m.includes("sample") || m.includes("survey") || m.includes("sampling")) {
    return "For sampling methods: start with SRS vs stratified designs, then practice variance estimation. On iGOT Karmayogi search 'sample survey' foundation modules, then NSSTA TPAC survey operations. Your open gaps: " + gaps;
  }
  if (m.includes("python") || m.includes("sql") || m.includes("data")) {
    return "Strengthen technical skills with short daily drills: SQL joins on statistical tables, then Python pandas for microdata cleaning. Pair this with your Technical domain gaps: " + gaps;
  }
  if (m.includes("hello") || m.includes("hi ") || m === "hi" || m === "hello") {
    return "Namaste. I am PrashikshanSetu coach. Ask about a skill gap (e.g. sampling, SDG indicators, Python) and I will suggest an iGOT / NSSTA style path. Current gap context: " + gaps;
  }
  return "Focus first on high-severity gaps, take one recommended iGOT/NSSTA module, then generate a practice quiz from your notes. Gap context: " + gaps + ". Try asking about sampling, data quality, or Python next.";
}
