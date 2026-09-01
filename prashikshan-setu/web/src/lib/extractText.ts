/**
 * Client-side text extraction for common training material formats.
 * Used by Build quiz page so coordinators can upload Word / PDF / Excel / PPT / images.
 */

export type ExtractResult = {
  text: string;
  warning?: string;
};

function isProbablyBinaryGarbage(text: string): boolean {
  if (!text || text.length < 8) return true;
  if (text.startsWith("PK") || text.startsWith("%PDF")) return true;
  if (text.includes("word/document.xml") || text.includes("[Content_Types].xml")) return true;
  const sample = text.slice(0, 1500);
  let bad = 0;
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i);
    if (c === 0 || (c < 9) || (c > 13 && c < 32) || c === 0xfffd) bad++;
  }
  return bad / sample.length > 0.12;
}

/** .txt / .md / .csv / .json */
async function fromPlainText(file: File): Promise<ExtractResult> {
  const text = await file.text();
  if (isProbablyBinaryGarbage(text)) {
    throw new Error("File does not look like readable plain text.");
  }
  return { text: text.slice(0, 80000) };
}

/** .docx via mammoth */
async function fromDocx(file: File): Promise<ExtractResult> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  const text = (result.value || "").trim();
  if (text.length < 20) {
    throw new Error("Could not extract enough text from this Word file. Try pasting the content.");
  }
  return {
    text: text.slice(0, 80000),
    warning: result.messages?.length
      ? "Some Word formatting could not be converted; review the extracted text."
      : undefined,
  };
}

/** Legacy .doc — not supported in browser without server */
async function fromDoc(_file: File): Promise<ExtractResult> {
  throw new Error(
    "Old .doc format is not supported in the browser. Open in Word → Save As .docx or .txt, or paste the text.",
  );
}

/** PDF via pdfjs-dist */
async function fromPdf(file: File): Promise<ExtractResult> {
  const pdfjs = await import("pdfjs-dist");
  // Vite-friendly worker
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const maxPages = Math.min(doc.numPages, 40); // cap for demo performance
  const parts: string[] = [];
  for (let i = 1; i <= maxPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? String(item.str) : ""))
      .join(" ");
    if (line.trim()) parts.push(line);
  }
  const text = parts.join("\n").replace(/\s+\n/g, "\n").trim();
  if (text.length < 20) {
    throw new Error(
      "This PDF has little or no extractable text (may be scanned images). Use OCR offline or paste text.",
    );
  }
  return {
    text: text.slice(0, 80000),
    warning:
      doc.numPages > maxPages
        ? `Only the first ${maxPages} pages were read (${doc.numPages} total).`
        : undefined,
  };
}

/** Excel .xlsx / .xls via SheetJS */
async function fromSpreadsheet(file: File): Promise<ExtractResult> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const parts: string[] = [];
  for (const name of wb.SheetNames.slice(0, 10)) {
    const sheet = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      parts.push(`--- Sheet: ${name} ---\n${csv.trim()}`);
    }
  }
  const text = parts.join("\n\n").trim();
  if (text.length < 20) {
    throw new Error("No readable cells found in the spreadsheet.");
  }
  return { text: text.slice(0, 80000) };
}

/**
 * PPTX: unzip and pull text from a:t nodes in slide XML.
 * Good enough for speaker notes / title / body text in most decks.
 */
async function fromPptx(file: File): Promise<ExtractResult> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)/i)?.[1] || 0);
      const nb = Number(b.match(/slide(\d+)/i)?.[1] || 0);
      return na - nb;
    })
    .slice(0, 50);

  if (!slideFiles.length) {
    throw new Error("No slides found in this PowerPoint file.");
  }

  const parts: string[] = [];
  for (const path of slideFiles) {
    const xml = await zip.files[path].async("string");
    // Extract text inside <a:t>...</a:t>
    const matches = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)];
    const slideText = matches
      .map((m) => m[1])
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (slideText) {
      const n = path.match(/slide(\d+)/i)?.[1] || "?";
      parts.push(`--- Slide ${n} ---\n${slideText}`);
    }
  }

  // Optional notes
  const noteFiles = Object.keys(zip.files).filter((p) =>
    /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(p),
  );
  for (const path of noteFiles.slice(0, 30)) {
    const xml = await zip.files[path].async("string");
    const matches = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)];
    const noteText = matches
      .map((m) => m[1])
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (noteText && noteText.length > 5) {
      parts.push(`--- Notes ---\n${noteText}`);
    }
  }

  const text = parts.join("\n\n").trim();
  if (text.length < 20) {
    throw new Error(
      "Could not extract text from this PowerPoint. Export slides as PDF or paste notes as text.",
    );
  }
  return {
    text: text.slice(0, 80000),
    warning: "PowerPoint text is extracted from slide/notes XML; layout is flattened.",
  };
}

/** Images: optional OCR via tesseract.js (lazy) */
async function fromImage(file: File): Promise<ExtractResult> {
  try {
    const Tesseract = await import("tesseract.js");
    const { data } = await Tesseract.recognize(file, "eng", {
      logger: () => {},
    });
    const text = (data.text || "").trim();
    if (text.length < 15) {
      throw new Error("OCR found little text. Prefer typing or pasting notes.");
    }
    return {
      text: text.slice(0, 80000),
      warning: "Text was read from the image via OCR; accuracy depends on image quality.",
    };
  } catch (e) {
    if (e instanceof Error && e.message.includes("OCR found")) throw e;
    throw new Error(
      "Image OCR failed or is unavailable. Paste the text from the image, or convert notes to .txt / .docx.",
    );
  }
}

export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();

  if (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".csv") ||
    name.endsWith(".json") ||
    type.startsWith("text/")
  ) {
    return fromPlainText(file);
  }
  if (name.endsWith(".docx") || type.includes("wordprocessingml")) {
    return fromDocx(file);
  }
  if (name.endsWith(".doc") || type === "application/msword") {
    return fromDoc(file);
  }
  if (name.endsWith(".pdf") || type === "application/pdf") {
    return fromPdf(file);
  }
  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    type.includes("spreadsheet") ||
    type.includes("excel")
  ) {
    return fromSpreadsheet(file);
  }
  if (name.endsWith(".pptx") || type.includes("presentationml")) {
    return fromPptx(file);
  }
  if (name.endsWith(".ppt")) {
    throw new Error(
      "Old .ppt format is not supported. Open in PowerPoint → Save As .pptx or export PDF, then upload.",
    );
  }
  if (
    type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(name)
  ) {
    return fromImage(file);
  }

  // Last resort: try as text
  try {
    return await fromPlainText(file);
  } catch {
    throw new Error(
      `Unsupported file type “${file.name}”. Use .txt, .md, .docx, .pdf, .xlsx, .pptx, or an image with text.`,
    );
  }
}

export const ACCEPT_ATTR =
  ".txt,.md,.csv,.json,.docx,.doc,.pdf,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.gif,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*";
