# PrashikshanSetu — multi-format upload + AI cascade

## Files to copy into your repo

```
server/src/ai.ts                 # dual OpenRouter model + local fallback
server/src/index.ts              # reject raw binary on API
web/package.json                 # NEW deps: mammoth, pdfjs-dist, xlsx, jszip, tesseract.js
web/src/lib/extractText.ts       # NEW — extracts text from many file types
web/src/pages/GenerateQuiz.tsx   # uses extractText on upload
docs/AI-FALLBACK-UPDATE.md
```

After replacing files, in the **web** folder run once locally (or let Vercel install on deploy):

```bash
cd web && npm install
```

Push to GitHub → Vercel rebuilds the frontend; Render rebuilds the API if `server/` changed.

---

## Supported uploads (client-side extraction)

| Type | Extensions | How text is obtained |
|------|------------|----------------------|
| Plain text | `.txt` `.md` `.csv` `.json` | Direct read |
| Word | `.docx` | mammoth (raw text) |
| Old Word | `.doc` | Not supported — save as `.docx` or paste |
| PDF | `.pdf` | pdf.js (first 40 pages) |
| Excel | `.xlsx` `.xls` | SheetJS → CSV per sheet |
| PowerPoint | `.pptx` | JSZip + slide/notes XML text |
| Old PPT | `.ppt` | Not supported — save as `.pptx` |
| Images | `.png` `.jpg` `.webp` … | tesseract.js OCR (English) |

Extracted text appears in the textarea so the coordinator can **review/edit** before **Generate MCQs**.

### Limits / tips

- Scanned PDFs with no text layer → use image OCR or paste manually.
- Image OCR is slower and less accurate than real text files.
- Very large decks/PDFs are capped (pages/slides) for browser performance.
- Legacy `.doc` / `.ppt` binary formats need conversion first.

---

## AI models (Render env)

```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_MODELS=google/gemini-2.0-flash-exp:free,meta-llama/llama-3.2-3b-instruct:free
```

Flow: Model 1 → Model 2 → local knowledge-base responder.
