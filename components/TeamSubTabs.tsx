import Link from "next/link";

const TABS = [
  { key: "roster", href: "/roster", label: "Roster" },
  { key: "gallery", href: "/gallery", label: "Photos" },
] as const;

export function TeamSubTabs({
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
