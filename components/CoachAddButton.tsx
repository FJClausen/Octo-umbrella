"use client";

import Link from "next/link";
import { useState } from "react";

const ITEMS = [
  { href: "/coaches/events?add=1", label: "Event", icon: "🗓" },
  { href: "/coaches/news?add=1", label: "News post", icon: "📣" },
  { href: "/coaches/roster?add=1", label: "Player", icon: "👕" },
  { href: "/coaches/practice/exercises?add=1", label: "Exercise", icon: "⚽" },
];

/** Floating "+" for coaches — one tap to create anything from anywhere
 *  in the Coaching Corner. */
export function CoachAddButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="flex flex-col items-end gap-2">
          {ITEMS.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-brand-ink shadow-card hover:bg-slate-50"
            >
              <span>{i.icon}</span> {i.label}
            </Link>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close add menu" : "Add"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-3xl leading-none text-white shadow-lg transition hover:bg-brand-green-dark"
      >
        {open ? "×" : "+"}
      </button>
    </div>
  );
}
