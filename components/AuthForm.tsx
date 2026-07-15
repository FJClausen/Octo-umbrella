"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";

export type AuthState = { error?: string; success?: string } | null;

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Please wait…" : label}
    </button>
  );
}

export function AuthForm({
  mode,
  action,
  redirectTo,
}: {
  mode: "login" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  redirectTo?: string;
}) {
  const [state, formAction] = useFormState(action, null);
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo ? (
        <input type="hidden" name="redirect" value={redirectTo} />
      ) : null}

      {isSignup ? (
        <div>
          <label className="label" htmlFor="full_name">
            Your name
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            className="input"
            placeholder="e.g. Jamie Rivera"
            autoComplete="name"
          />
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="input"
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
      </div>

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg bg-brand-green-light px-3 py-2 text-sm text-brand-green-dark">
          {state.success}
        </p>
      ) : null}

      <Submit label={isSignup ? "Create account" : "Sign in"} />

      <p className="text-center text-sm text-slate-500">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-blue">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-brand-blue">
              Request an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
