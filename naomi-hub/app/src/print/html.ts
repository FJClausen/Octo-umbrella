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
  /** Page 2 heading; defaults to "Answer key: <title>". */
  page2Title?: string;
  /** Page 2 is reference material (not solutions), so it prints too. Answer keys never print. */
  printPage2?: boolean;
  /** Printed on page 1 only, so a photo of the answer key can't pass as Naomi's work. */
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
${sheet.printPage2 ? '' : ANSWERS_START}<section class="page">
  <h1>${escapeHtml(sheet.page2Title ?? `Answer key: ${sheet.title}`)}</h1>
  ${sheet.answerHtml}
</section>${sheet.printPage2 ? '' : ANSWERS_END}
</body></html>`;
}

const ANSWERS_START = '<!--answers-->';
const ANSWERS_END = '<!--/answers-->';

/**
 * Splits a rendered sheet into what goes to the printer (never the answer key) and the
 * answer key on its own, for viewing in the app. `answers` is null when the sheet has none.
 */
export function splitSheet(html: string): { print: string; answers: string | null; title: string } {
  const title = (html.match(/<h1>([^<]*)<\/h1>/)?.[1] ?? 'Sheet').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  const start = html.indexOf(ANSWERS_START);
  const end = html.indexOf(ANSWERS_END);
  if (start < 0 || end < start) return { print: html, answers: null, title };
  const head = html.slice(0, html.indexOf('<body>') + '<body>'.length);
  const answers = `${head.replace('</head>', '<style>body{padding:24px}</style></head>')}${html.slice(start + ANSWERS_START.length, end)}</body></html>`;
  return { print: html.slice(0, start) + html.slice(end + ANSWERS_END.length), answers, title };
}
