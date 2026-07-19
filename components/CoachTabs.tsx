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
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
      {TABS.map((t) => {
        const active =
          t.href === "/coaches"
            ? pathname === "/coaches"
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-brand-blue text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
