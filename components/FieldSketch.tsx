"use client";

import { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type Stroke = { color: string; points: Point[] };

const CANVAS_W = 800;
const CANVAS_H = 520;

const COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Yellow", value: "#FDE047" },
  { name: "Red", value: "#DC2626" },
  { name: "Navy", value: "#0F2E4D" },
];

function drawField(ctx: CanvasRenderingContext2D) {
  const w = CANVAS_W;
  const h = CANVAS_H;
  const m = 24; // margin

  // Grass with subtle mowing stripes
  ctx.fillStyle = "#4C8C3F";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) ctx.fillRect((w / 8) * i, 0, w / 8, h);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";

  // Touchlines
  ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
  // Halfway line
  ctx.beginPath();
  ctx.moveTo(w / 2, m);
  ctx.lineTo(w / 2, h - m);
  ctx.stroke();
  // Center circle + spot
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();

  // Penalty + goal boxes, both ends
  const penW = 110;
  const penH = 220;
  const goalW = 45;
  const goalH = 110;
  for (const left of [true, false]) {
    const x = left ? m : w - m;
    const dir = left ? 1 : -1;
    ctx.strokeRect(
      left ? x : x - penW,
      h / 2 - penH / 2,
      penW,
      penH
    );
    ctx.strokeRect(
      left ? x : x - goalW,
      h / 2 - goalH / 2,
      goalW,
      goalH
    );
    // Penalty spot
    ctx.beginPath();
    ctx.arc(x + dir * 80, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * A lightweight sketch pad over a soccer pitch. Strokes are exported as a
 * PNG data URL into a hidden form input so the surrounding server-action
 * form can upload the drawing like any other image.
 */
export function FieldSketch({ inputName = "sketch_data" }: { inputName?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(COLORS[0].value);
  const [dataUrl, setDataUrl] = useState("");
  const drawingRef = useRef<Stroke | null>(null);

  function redraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawField(ctx);
    for (const stroke of [...strokes, drawingRef.current].filter(
      Boolean
    ) as Stroke[]) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (const p of stroke.points.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(redraw, [strokes]);

  function canvasPoint(e: React.PointerEvent): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    drawingRef.current = { color, points: [canvasPoint(e)] };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    drawingRef.current.points.push(canvasPoint(e));
    redraw();
  }

  function onPointerUp() {
    const stroke = drawingRef.current;
    drawingRef.current = null;
    if (stroke && stroke.points.length > 1) {
      const next = [...strokes, stroke];
      setStrokes(next);
      // Export after the state settles (redraw happens via effect).
      requestAnimationFrame(() => {
        const url = canvasRef.current?.toDataURL("image/png") ?? "";
        setDataUrl(next.length ? url : "");
      });
    }
  }

  function undo() {
    const next = strokes.slice(0, -1);
    setStrokes(next);
    requestAnimationFrame(() => {
      setDataUrl(
        next.length ? canvasRef.current?.toDataURL("image/png") ?? "" : ""
      );
    });
  }

  function clear() {
    setStrokes([]);
    setDataUrl("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.name}
            onClick={() => setColor(c.value)}
            className={`h-7 w-7 rounded-full border-2 ${
              color === c.value ? "border-brand-ink" : "border-slate-300"
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={undo}
          disabled={!strokes.length}
          className="btn-outline px-3 py-1 text-xs"
        >
          ↩ Undo
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={!strokes.length}
          className="btn-outline px-3 py-1 text-xs"
        >
          Clear
        </button>
        {strokes.length > 0 ? (
          <span className="text-xs text-brand-green-dark">
            ✓ Sketch will be saved with the exercise
          </span>
        ) : null}
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
      <input type="hidden" name={inputName} value={dataUrl} />
    </div>
  );
}
