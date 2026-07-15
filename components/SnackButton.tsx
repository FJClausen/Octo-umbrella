"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimSnackAction, releaseSnackAction } from "@/app/(app)/snacks/actions";

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
        className="btn-outline text-sm"
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
        className="btn-primary text-sm"
      >
        {isPending ? "…" : "I'll bring it"}
      </button>
    );
  }

  return null;
}
