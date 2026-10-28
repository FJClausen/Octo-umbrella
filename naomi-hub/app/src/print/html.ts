/** Shared print shell: black and white, Letter/A4-safe margins, nothing under 12pt. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const BASE_CSS = `
@page { margin: 0.6in; }
* { box-sizing: border-box; color: #000; }
html, body { margin: 0; padding: 0; background: #fff; }
body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 14pt; line-height: 1.35; }
h1 { font-size: 24pt; margin: 0 0 4pt; }
h2 { font-size: 18pt; margin: 14pt 0 6pt; }
.sub { font-size: 13pt; margin: 0 0 14pt; }
.page { page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }
.name { font-size: 13pt; margin-bottom: 10pt; }
.center { display: flex; flex-direction: column; align-items: center; }
.small { font-size: 12pt; }
.top { display: flex; justify-content: space-between; align-items: baseline; }
.code { font-size: 14pt; font-weight: 700; border: 2px solid #000; padding: 2pt 6pt; letter-spacing: 2pt; }
table { border-collapse: collapse; }
`;

export interface Sheet {
  title: string;
  subtitle?: string;
  puzzleHtml: string;
  answerHtml: string;
  css?: string;
  /** Printed on page 1 only, so a photo of the answer key can't pass as her work. */
  code?: string;
}

/** Page 1: puzzle. Page 2: answer key. */
export function renderSheet(sheet: Sheet): string {
  const sub = sheet.subtitle ? `<p class="sub">${escapeHtml(sheet.subtitle)}</p>` : '';
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${BASE_CSS}${sheet.css ?? ''}</style></head><body>
<section class="page">
  <div class="top"><div class="name">Name: ______________________ &nbsp; Date: ____________</div>${sheet.code ? `<div class="code">Sheet ${escapeHtml(sheet.code)}</div>` : ''}</div>
  <h1>${escapeHtml(sheet.title)}</h1>${sub}
  ${sheet.puzzleHtml}
</section>
<section class="page">
  <h1>Answer key: ${escapeHtml(sheet.title)}</h1>
  ${sheet.answerHtml}
</section>
</body></html>`;
}
