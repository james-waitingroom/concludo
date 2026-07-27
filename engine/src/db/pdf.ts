/**
 * Render a contract's markdown source into a simple, real PDF (used for seeding source documents).
 * Not a full markdown renderer — it strips heading/bold markers and word-wraps to the page width,
 * paginating as needed. Good enough to produce genuine, downloadable PDF source files.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// The standard Helvetica font is WinAnsi-encoded and can't render arbitrary Unicode.
// Map common typographic/math characters to ASCII, then drop anything still non-ASCII.
const MAP: Record<string, string> = {
  "≈": "~", "≠": "!=", "≤": "<=", "≥": ">=", "→": "->", "←": "<-",
  "—": "-", "–": "-", "‘": "'", "’": "'", "“": '"', "”": '"',
  "…": "...", "•": "-", "×": "x", "−": "-", " ": " ", "′": "'", "″": '"',
  "€": "EUR", "£": "GBP", "™": "(TM)", "®": "(R)", "©": "(C)",
};
function sanitize(s: string): string {
  return s.replace(/[\s\S]/g, (ch) => MAP[ch] ?? ch).replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

export async function markdownToPdf(input: string): Promise<Uint8Array> {
  const text = sanitize(input);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const size = 9;
  const lineH = 12.5;
  const margin = 54;
  const pageW = 612, pageH = 792; // US Letter
  const maxW = pageW - margin * 2;
  const ink = rgb(0.11, 0.16, 0.19);

  type Line = { t: string; heading: boolean };
  const out: Line[] = [];
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const heading = /^#{1,6}\s/.test(raw);
    const clean = raw.replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "").replace(/`/g, "");
    if (clean.trim() === "") { out.push({ t: "", heading: false }); continue; }
    const f = heading ? bold : font;
    const fSize = heading ? size + 1 : size;
    let line = "";
    for (const word of clean.split(/\s+/)) {
      const test = line ? line + " " + word : word;
      if (f.widthOfTextAtSize(test, fSize) > maxW && line) { out.push({ t: line, heading }); line = word; }
      else line = test;
    }
    if (line) out.push({ t: line, heading });
  }

  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;
  for (const ln of out) {
    if (y < margin) { page = doc.addPage([pageW, pageH]); y = pageH - margin; }
    if (ln.t) page.drawText(ln.t, { x: margin, y, size: ln.heading ? size + 1 : size, font: ln.heading ? bold : font, color: ink });
    y -= ln.heading ? lineH + 3 : lineH;
  }

  return await doc.save();
}
