import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Card, EmptyState, SubmitButton } from "@/components/ui";
import {
  approveMember,
  denyMember,
  promoteToCoach,
  demoteToParent,
} from "./actions";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Approvals" };

function MemberRow({
  m,
  selfId,
}: {
  m: Profile;
  selfId: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div>
        <p className="font-medium text-brand-ink">
          {m.full_name || "(no name)"}{" "}
          {m.role === "coach" ? (
            <span className="badge bg-brand-blue-light text-brand-blue-dark">
              Coach
            </span>
          ) : null}
        </p>
        <p className="text-sm text-slate-500">{m.email}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {m.status === "pending" ? (
          <>
            <form action={approveMember}>
              <input type="hidden" name="id" value={m.id} />
              <SubmitButton>Approve</SubmitButton>
            </form>
            <form action={denyMember}>
              <input type="hidden" name="id" value={m.id} />
              <SubmitButton variant="danger">Deny</SubmitButton>
            </form>
          </>
        ) : m.id === selfId ? (
          <span className="text-sm text-slate-400">That’s you</span>
        ) : m.role === "coach" ? (
          <form action={demoteToParent}>
            <input type="hidden" name="id" value={m.id} />
            <SubmitButton variant="outline">Make parent</SubmitButton>
          </form>
        ) : (
          <>
            <form action={promoteToCoach}>
              <input type="hidden" name="id" value={m.id} />
              <SubmitButton variant="blue">Make coach</SubmitButton>
            </form>
            {m.status === "approved" ? (
              <form action={denyMember}>
                <input type="hidden" name="id" value={m.id} />
                <SubmitButton variant="danger">Revoke</SubmitButton>
              </form>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default async function ApprovalsPage() {
  const supabase = createClient();
  const current = await getCurrentProfile();

  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const pending = (members ?? []).filter((m) => m.status === "pending");
  const active = (members ?? []).filter((m) => m.status === "approved");
  const denied = (members ?? []).filter((m) => m.status === "denied");

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Approve new families, revoke access, and promote an assistant coach.
        Coaches see the Coaches Corner; parents don’t. To invite someone, share
        the site link and have them tap “Request an account.”
      </p>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-600">
          Waiting for approval ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <Card className="divide-y divide-slate-100 py-0">
            {pending.map((m) => (
              <MemberRow key={m.id} m={m} selfId={current!.userId} />
            ))}
          </Card>
        ) : (
          <EmptyState title="No pending requests" />
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Approved members ({active.length})
        </h2>
        <Card className="divide-y divide-slate-100 py-0">
          {active.map((m) => (
            <MemberRow key={m.id} m={m} selfId={current!.userId} />
          ))}
        </Card>
      </section>

      {denied.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Denied ({denied.length})
          </h2>
          <Card className="divide-y divide-slate-100 py-0">
            {denied.map((m) => (
              <MemberRow key={m.id} m={m} selfId={current!.userId} />
            ))}
          </Card>
        </section>
      ) : null}
    </div>
  );
}
