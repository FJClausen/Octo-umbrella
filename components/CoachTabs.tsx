"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/coaches", label: "Overview" },
  { href: "/coaches/roster", label: "Roster" },
  { href: "/coaches/events", label: "Events" },
  { href: "/coaches/gameday", label: "Game Day" },
  { href: "/coaches/practice", label: "Practice" },
];

export function CoachTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {TABS.map((t) => {
        const active =
          t.href === "/coaches"
            ? pathname === "/coaches"
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-center text-sm font-semibold transition ${
              active
                ? "bg-white text-brand-ink shadow-card"
                : "text-slate-500 hover:text-brand-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
