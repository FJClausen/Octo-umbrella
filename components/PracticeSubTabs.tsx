import Link from "next/link";

const TABS = [
  { key: "sessions", href: "/coaches/practice", label: "Practice Sessions" },
  {
    key: "exercises",
    href: "/coaches/practice/exercises",
    label: "Exercise Catalogue",
  },
] as const;

export function PracticeSubTabs({
  active,
}: {
  active: (typeof TABS)[number]["key"];
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-semibold transition ${
            active === t.key
              ? "bg-white text-brand-ink shadow-card"
              : "text-slate-500 hover:text-brand-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
