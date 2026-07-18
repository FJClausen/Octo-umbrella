import Link from "next/link";
import type { ReactNode } from "react";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/site";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-slate-500">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

const EVENT_BADGE: Record<EventType, string> = {
  game: "bg-brand-green-light text-brand-green-dark",
  practice: "bg-brand-blue-light text-brand-blue-dark",
  event: "bg-amber-100 text-amber-800",
};

export function EventTypeBadge({ type }: { type: string }) {
  const t = (type as EventType) in EVENT_BADGE ? (type as EventType) : "event";
  return (
    <span className={`badge ${EVENT_BADGE[t]}`}>{EVENT_TYPE_LABELS[t]}</span>
  );
}

/** Light background + border tint in the event's color, so cards for games,
 *  practices, and team events are distinguishable at a glance. */
const EVENT_CARD_TINT: Record<EventType, string> = {
  game: "border-brand-green/40 bg-brand-green-light/80",
  practice: "border-brand-blue/40 bg-brand-blue-light/80",
  event: "border-amber-300/60 bg-amber-100/60",
};

export function eventCardTint(type: string): string {
  const t =
    (type as EventType) in EVENT_CARD_TINT ? (type as EventType) : "event";
  return EVENT_CARD_TINT[t];
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "blue" | "outline";
}) {
  const cls =
    variant === "blue"
      ? "btn-blue"
      : variant === "outline"
        ? "btn-outline"
        : "btn-primary";
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Small helper for coach-only submit buttons inside forms. */
export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "blue" | "outline" | "danger";
}) {
  const cls =
    variant === "blue"
      ? "btn-blue"
      : variant === "outline"
        ? "btn-outline"
        : variant === "danger"
          ? "btn-danger"
          : "btn-primary";
  return (
    <button type="submit" className={cls}>
      {children}
    </button>
  );
}
