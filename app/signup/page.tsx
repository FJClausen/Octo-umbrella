import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentProfile } from "@/lib/auth";
import { signUpAction } from "./actions";

export const metadata = { title: "Request an account" };

export default async function SignupPage() {
  const current = await getCurrentProfile();
  if (current) redirect("/home");

  return (
    <AuthShell title="Request an account">
      <p className="mb-4 text-sm text-slate-500">
        Create your account to join the team hub. A coach will review and
        approve new families before you get access.
      </p>
      <AuthForm mode="signup" action={signUpAction} />
    </AuthShell>
  );
}
