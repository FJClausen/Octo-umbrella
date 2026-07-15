import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getCurrentProfile } from "@/lib/auth";

export const metadata = { title: "Awaiting approval" };

export default async function PendingPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login");
  if (current.profile?.status === "approved") redirect("/home");

  const denied = current.profile?.status === "denied";

  return (
    <AuthShell title={denied ? "Access not granted" : "Almost there!"}>
      <div className="space-y-4 text-sm text-slate-600">
        {denied ? (
          <p>
            Your account request wasn’t approved. If you think this is a
            mistake, please reach out to your coach.
          </p>
        ) : (
          <>
            <p>
              Thanks for signing up{current.profile?.full_name ? `, ${current.profile.full_name.split(" ")[0]}` : ""}!
              Your account is waiting for a coach to approve it. You’ll be able
              to see the calendar, news, snack schedule, and roster as soon as
              you’re approved.
            </p>
            <p className="text-slate-500">
              This page will let you in automatically once you’re approved —
              just check back or refresh.
            </p>
          </>
        )}
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn-outline w-full">
            Sign out
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
