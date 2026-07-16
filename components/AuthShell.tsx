import type { ReactNode } from "react";
import { site } from "@/lib/site";

export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-blue-light to-brand-green-light px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="rainbow-bar mx-auto mb-2 h-1.5 w-20 rounded-full" />
          {site.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.logoUrl}
              alt={site.teamName}
              className="mx-auto mb-3 h-16 w-16 rounded-full object-cover shadow-card"
            />
          ) : (
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue-dark text-2xl text-white shadow-card">
              ⚽
            </div>
          )}
          <h1 className="text-xl font-bold text-brand-ink">{site.teamName}</h1>
          <p className="text-sm text-slate-500">
            {site.tagline} · {site.season}
          </p>
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-brand-ink">{title}</h2>
          {children}
        </div>
      </div>
    </main>
  );
}
