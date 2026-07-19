"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimSnackAction, releaseSnackAction } from "@/app/(app)/calendar/actions";

export function SnackButton({
  slotId,
  mine,
  open,
}: {
  slotId: string;
  mine: boolean;
  open: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(fn: (id: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await fn(slotId);
      if (res?.error) alert(res.error);
      router.refresh();
    });
  }

  if (mine) {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(releaseSnackAction)}
        className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
      >
        {isPending ? "…" : "Give up"}
      </button>
    );
  }

  if (open) {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(claimSnackAction)}
        className="rounded-full bg-brand-green px-3 py-0.5 text-xs font-semibold text-white transition hover:bg-brand-green-dark disabled:opacity-60"
      >
        {isPending ? "…" : "I'll bring it"}
      </button>
    );
  }

  return null;
}
