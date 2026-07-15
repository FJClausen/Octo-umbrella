import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentProfile } from "@/lib/auth";
import { signInAction } from "./actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const current = await getCurrentProfile();
  if (current) redirect("/home");

  return (
    <AuthShell title="Sign in">
      <AuthForm
        mode="login"
        action={signInAction}
        redirectTo={searchParams.redirect}
      />
    </AuthShell>
  );
}
