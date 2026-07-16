"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };

const PARENT_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: "🥅" },
  { href: "/calendar", label: "Calendar", icon: "🏟️" },
  { href: "/news", label: "News", icon: "📣" },
  { href: "/roster", label: "Roster", icon: "👕" },
  { href: "/gallery", label: "Gallery", icon: "📸" },
];

export function NavBar({
  teamName,
  season,
  isCoach,
  fullName,
  logoUrl,
}: {
  teamName: string;
  season: string;
  isCoach: boolean;
  fullName: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const items = PARENT_NAV;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="rainbow-bar h-1 w-full" />
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/home" className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={teamName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue-dark text-white">
                ⚽
              </span>
            )}
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-brand-ink">
                {teamName}
              </span>
              <span className="text-[11px] text-slate-400">{season}</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(item.href)
                    ? "bg-brand-green-light text-brand-green-dark"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isCoach ? (
              <Link
                href="/coaches"
                className={`ml-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  isActive("/coaches")
                    ? "bg-brand-blue text-white"
                    : "bg-brand-blue-light text-brand-blue-dark hover:bg-brand-blue hover:text-white"
                }`}
              >
                Coaches Corner
              </Link>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="hidden text-sm text-slate-500 hover:text-brand-ink sm:block"
              title="Account settings"
            >
              {fullName || "Account"}
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-brand-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white sm:hidden">
        <div className="mx-auto grid max-w-4xl grid-cols-6">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                isActive(item.href)
                  ? "text-brand-green-dark"
                  : "text-slate-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <Link
            href={isCoach ? "/coaches" : "/account"}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              isActive(isCoach ? "/coaches" : "/account")
                ? "text-brand-blue-dark"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg">{isCoach ? "📋" : "👤"}</span>
            {isCoach ? "Coaches" : "Account"}
          </Link>
        </div>
      </nav>
    </>
  );
}
