"use client";

import { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type TokenType = "attacker" | "defender" | "ball" | "cone" | "goal";
type LineType = "pass" | "run" | "dribble";
type Tool = TokenType | LineType | "draw" | "erase";

export type SketchElement =
  | { kind: "token"; token: TokenType; x: number; y: number; n: number }
  | { kind: "line"; line: LineType; from: Point; to: Point }
  | { kind: "free"; points: Point[] };

type Element = SketchElement;

const CANVAS_W = 800;
const CANVAS_H = 520;

/** AI-friendly diagram spec: fractional coordinates (0–1) across the pitch. */
export type SketchDiagram = {
  tokens: { kind: TokenType; x: number; y: number }[];
  arrows: {
    kind: LineType;
    from_x: number;
    from_y: number;
    to_x: number;
    to_y: number;
  }[];
};

/** Convert a fractional-coordinate diagram into canvas elements, clamping
 *  everything onto the pitch and numbering attackers/defenders in order. */
export function diagramToElements(diagram: SketchDiagram): SketchElement[] {
  const m = 30; // keep tokens inside the touchlines
  const px = (x: number) => m + Math.min(1, Math.max(0, x)) * (CANVAS_W - 2 * m);
  const py = (y: number) => m + Math.min(1, Math.max(0, y)) * (CANVAS_H - 2 * m);

  const counts: Record<string, number> = {};
  const elements: SketchElement[] = [];

  for (const t of (diagram.tokens ?? []).slice(0, 30)) {
    if (!["attacker", "defender", "ball", "cone", "goal"].includes(t.kind))
      continue;
    const numbered = t.kind === "attacker" || t.kind === "defender";
    counts[t.kind] = (counts[t.kind] ?? 0) + 1;
    elements.push({
      kind: "token",
      token: t.kind,
      x: px(t.x),
      y: py(t.y),
      n: numbered ? counts[t.kind] : 0,
    });
  }
  for (const a of (diagram.arrows ?? []).slice(0, 12)) {
    if (!["pass", "run", "dribble"].includes(a.kind)) continue;
    const from = { x: px(a.from_x), y: py(a.from_y) };
    const to = { x: px(a.to_x), y: py(a.to_y) };
    if (Math.hypot(to.x - from.x, to.y - from.y) < 12) continue;
    elements.push({ kind: "line", line: a.kind, from, to });
  }
  return elements;
}

const ATTACKER_COLOR = "#0F2E4D"; // navy
const DEFENDER_COLOR = "#DC2626"; // red
const LINE_COLORS: Record<LineType, string> = {
  pass: "#FFFFFF",
  run: "#FDE047",
  dribble: "#7DD3FC",
};
const FREE_COLOR = "#FFFFFF";

const TOOLS: { key: Tool; label: string }[] = [
  { key: "attacker", label: "🔵 Attacker" },
  { key: "defender", label: "🔴 Defender" },
  { key: "ball", label: "⚽ Ball" },
  { key: "cone", label: "🔶 Cone" },
  { key: "goal", label: "🥅 Goal" },
  { key: "pass", label: "➡ Pass" },
  { key: "run", label: "⇢ Run" },
  { key: "dribble", label: "〰 Dribble" },
  { key: "draw", label: "✏️ Draw" },
  { key: "erase", label: "🧽 Erase" },
];

function drawField(ctx: CanvasRenderingContext2D) {
  const w = CANVAS_W;
  const h = CANVAS_H;
  const m = 24;

  ctx.fillStyle = "#4C8C3F";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) ctx.fillRect((w / 8) * i, 0, w / 8, h);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
  ctx.beginPath();
  ctx.moveTo(w / 2, m);
  ctx.lineTo(w / 2, h - m);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  const penW = 110;
  const penH = 220;
  const goalW = 45;
  const goalH = 110;
  for (const left of [true, false]) {
    const x = left ? m : w - m;
    const dir = left ? 1 : -1;
    ctx.strokeRect(left ? x : x - penW, h / 2 - penH / 2, penW, penH);
    ctx.strokeRect(left ? x : x - goalW, h / 2 - goalH / 2, goalW, goalH);
    ctx.beginPath();
    ctx.arc(x + dir * 80, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArrowHead(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = 13;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - size * Math.cos(angle - 0.45),
    to.y - size * Math.sin(angle - 0.45)
  );
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - size * Math.cos(angle + 0.45),
    to.y - size * Math.sin(angle + 0.45)
  );
  ctx.stroke();
}

function drawLineElement(
  ctx: CanvasRenderingContext2D,
  line: LineType,
  from: Point,
  to: Point
) {
  ctx.strokeStyle = LINE_COLORS[line];
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 8) return;

  if (line === "dribble") {
    // Wavy line: zigzag along the direction of travel.
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const half = 9; // half-wavelength
    const amp = 6;
    const usable = len - 16; // leave room for the arrowhead
    const steps = Math.max(2, Math.floor(usable / half));
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    for (let i = 1; i <= steps; i++) {
      const d = i * half;
      const side = i % 2 === 1 ? amp : -amp;
      ctx.lineTo(from.x + ux * d + px * side, from.y + uy * d + py * side);
    }
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  } else {
    ctx.setLineDash(line === "run" ? [12, 9] : []);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  drawArrowHead(ctx, from, to);
}

function drawToken(
  ctx: CanvasRenderingContext2D,
  token: TokenType,
  x: number,
  y: number,
  n: number
) {
  if (token === "ball") {
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0F172A";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#0F172A";
    ctx.fill();
    return;
  }
  if (token === "goal") {
    // A mini goal seen from above: back bar + posts, opening facing down,
    // with light net hatching.
    const w = 64;
    const d = 18;
    ctx.setLineDash([]);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + d / 2);
    ctx.lineTo(x - w / 2, y - d / 2);
    ctx.lineTo(x + w / 2, y - d / 2);
    ctx.lineTo(x + w / 2, y + d / 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    for (let i = 1; i < 6; i++) {
      const nx = x - w / 2 + (w / 6) * i;
      ctx.beginPath();
      ctx.moveTo(nx, y - d / 2);
      ctx.lineTo(nx, y + d / 2 - 4);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 2, y);
    ctx.lineTo(x + w / 2 - 2, y);
    ctx.stroke();
    return;
  }
  if (token === "cone") {
    // A little training cone: yellow triangle with a base bar.
    const s = 11;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x - s * 0.8, y + s * 0.7);
    ctx.lineTo(x + s * 0.8, y + s * 0.7);
    ctx.closePath();
    ctx.fillStyle = "#FDE047";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#B45309";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - s, y + s * 0.7);
    ctx.lineTo(x + s, y + s * 0.7);
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fillStyle = token === "attacker" ? ATTACKER_COLOR : DEFENDER_COLOR;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n), x, y + 0.5);
}

function drawElement(ctx: CanvasRenderingContext2D, el: Element) {
  if (el.kind === "token") {
    drawToken(ctx, el.token, el.x, el.y, el.n);
  } else if (el.kind === "line") {
    drawLineElement(ctx, el.line, el.from, el.to);
  } else {
    if (el.points.length < 2) return;
    ctx.strokeStyle = FREE_COLOR;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(el.points[0].x, el.points[0].y);
    for (const p of el.points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
}

/**
 * A tactics-board sketch pad over a soccer pitch: numbered attacker and
 * defender tokens, balls, pass/run/dribble arrows (solid / dashed / wavy),
 * and freehand drawing. Exports a PNG data URL into a hidden form input so
 * the surrounding server-action form uploads it like any other image.
 */
export function FieldSketch({
  inputName = "sketch_data",
  initialElements,
}: {
  inputName?: string;
  initialElements?: SketchElement[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<Element[]>(initialElements ?? []);
  const [tool, setTool] = useState<Tool>("attacker");
  const [dataUrl, setDataUrl] = useState("");
  const draftRef = useRef<Element | null>(null);

  function redraw() {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawField(ctx);
    for (const el of elements) drawElement(ctx, el);
    if (draftRef.current) drawElement(ctx, draftRef.current);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(redraw, [elements]);

  // A pre-filled sketch (e.g. AI-generated) should be exported for saving
  // even if the coach never touches it.
  useEffect(() => {
    if (elements.length) exportPng(elements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportPng(next: Element[]) {
    requestAnimationFrame(() => {
      setDataUrl(
        next.length ? canvasRef.current?.toDataURL("image/png") ?? "" : ""
      );
    });
  }

  function canvasPoint(e: React.PointerEvent): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  function nextNumber(token: TokenType): number {
    return (
      elements.filter((el) => el.kind === "token" && el.token === token)
        .length + 1
    );
  }

  /** Distance from point p to the segment a→b. */
  function distToSegment(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq
      ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq))
      : 0;
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  /** Re-number attacker/defender tokens 1..n after a deletion. */
  function renumber(els: Element[]): Element[] {
    const counts: Record<string, number> = {};
    return els.map((el) => {
      if (
        el.kind === "token" &&
        (el.token === "attacker" || el.token === "defender")
      ) {
        counts[el.token] = (counts[el.token] ?? 0) + 1;
        return { ...el, n: counts[el.token] };
      }
      return el;
    });
  }

  /** Delete the topmost element under the tap, if any. */
  function eraseAt(p: Point) {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      let hit = false;
      if (el.kind === "token") {
        hit =
          el.token === "goal"
            ? Math.abs(p.x - el.x) <= 36 && Math.abs(p.y - el.y) <= 14
            : Math.hypot(p.x - el.x, p.y - el.y) <= 18;
      } else if (el.kind === "line") {
        hit = distToSegment(p, el.from, el.to) <= 10;
      } else {
        hit = el.points.some((q) => Math.hypot(p.x - q.x, p.y - q.y) <= 10);
      }
      if (hit) {
        const next = renumber(elements.filter((_, idx) => idx !== i));
        setElements(next);
        exportPng(next);
        return;
      }
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as Element & EventTarget & HTMLElement).setPointerCapture?.(
      e.pointerId
    );
    const p = canvasPoint(e);
    if (tool === "erase") {
      eraseAt(p);
      return;
    }
    if (
      tool === "attacker" ||
      tool === "defender" ||
      tool === "ball" ||
      tool === "cone" ||
      tool === "goal"
    ) {
      draftRef.current = {
        kind: "token",
        token: tool,
        x: p.x,
        y: p.y,
        n: tool === "attacker" || tool === "defender" ? nextNumber(tool) : 0,
      };
    } else if (tool === "draw") {
      draftRef.current = { kind: "free", points: [p] };
    } else {
      draftRef.current = { kind: "line", line: tool, from: p, to: p };
    }
    redraw();
  }

  function onPointerMove(e: React.PointerEvent) {
    const draft = draftRef.current;
    if (!draft) return;
    const p = canvasPoint(e);
    if (draft.kind === "token") {
      draft.x = p.x;
      draft.y = p.y;
    } else if (draft.kind === "free") {
      draft.points.push(p);
    } else {
      draft.to = p;
    }
    redraw();
  }

  function onPointerUp() {
    const draft = draftRef.current;
    draftRef.current = null;
    if (!draft) return;
    // Discard zero-length lines (accidental taps with a line tool).
    if (
      draft.kind === "line" &&
      Math.hypot(draft.to.x - draft.from.x, draft.to.y - draft.from.y) < 12
    ) {
      redraw();
      return;
    }
    if (draft.kind === "free" && draft.points.length < 2) {
      redraw();
      return;
    }
    const next = [...elements, draft];
    setElements(next);
    exportPng(next);
  }

  function undo() {
    const next = elements.slice(0, -1);
    setElements(next);
    exportPng(next);
  }

  function clear() {
    setElements([]);
    setDataUrl("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTool(t.key)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              tool === t.key
                ? "bg-brand-ink text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={undo}
          disabled={!elements.length}
          className="btn-outline px-3 py-1 text-xs"
        >
          ↩ Undo
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={!elements.length}
          className="btn-outline px-3 py-1 text-xs"
        >
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="w-full cursor-crosshair rounded-lg border border-slate-200"
        style={{ touchAction: "none" }}
      />

      <p className="text-xs text-slate-400">
        Tap to place tokens (drag to position) · drag to draw lines — Pass ➡
        solid · Run ⇢ dashed · Dribble 〰 wavy · 🧽 tap an element to erase it
        {elements.length > 0 ? (
          <span className="ml-2 font-medium text-brand-green-dark">
            ✓ Sketch will be saved with the exercise
          </span>
        ) : null}
      </p>
      <input type="hidden" name={inputName} value={dataUrl} />
    </div>
  );
}
