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
    <AuthShell title={denied ? "Access not granted" : "Access requested"}>
      <div className="space-y-4 text-sm text-slate-600">
        {denied ? (
          <p>
            Your account request wasn’t approved. If you think this is a
            mistake, please reach out to your coach.
          </p>
        ) : (
          <>
            <p>
              Thanks{current.profile?.full_name ? `, ${current.profile.full_name.split(" ")[0]}` : ""}!
              Your request for access is <strong>with your coach</strong> now.
              Nothing more to do — once they approve it you’ll see the
              calendar, news, snack sign-ups, and the team roster.
            </p>
            <p className="text-slate-500">
              This page lets you in automatically once you’re approved, so
              check back or refresh later. Coaches usually get to requests
              within a day or two.
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
