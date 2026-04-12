import Link from "next/link";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getSetupReadiness } from "@/server/services/setup-service";

const authErrorMessages: Record<string, string> = {
  OAuthCallback:
    "Google sign-in reached the callback step but the server could not complete the session. This is usually a database or callback configuration problem.",
  AccessDenied:
    "Google sign-in was denied. Check the Google OAuth consent screen and allowed test users.",
  Configuration:
    "Auth.js configuration is incomplete for this environment.",
  Verification:
    "The sign-in response could not be verified.",
  Default:
    "Google sign-in failed before a host session could be created.",
};

type SignInPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const readiness = getSetupReadiness();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorCode = resolvedSearchParams?.error;
  const errorMessage = errorCode
    ? authErrorMessages[errorCode] ?? authErrorMessages.Default
    : null;
  const missingAuthKeys = readiness.env
    .filter(
      (item) =>
        [
          "GOOGLE_CLIENT_ID",
          "GOOGLE_CLIENT_SECRET",
          "NEXTAUTH_SECRET",
          "NEXTAUTH_URL",
        ].includes(item.key) && !item.configured,
    )
    .map((item) => item.key);

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-12 text-stone-900">
      <section className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Host Sign-In
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
          Sign in with Google to manage your booking page.
        </h1>
        <p className="mt-4 text-base leading-8 text-stone-600">
          This is the host-only entry point for calendars, event types,
          bookings, and operational checks.
        </p>

        {readiness.readyForLiveAuth ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-900">
            Live Google sign-in is configured for this environment.
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-700">
            Required next step:
            <br />
            <span className="font-medium text-stone-950">
              configure {missingAuthKeys.join(", ")}.
            </span>
          </div>
        )}

        {errorCode ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-7 text-rose-900">
            <span className="font-semibold">Sign-in error: {errorCode}</span>
            <br />
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <GoogleSignInButton />
          <Link
            href="/"
            className="inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
          >
            Back to project overview
          </Link>
        </div>
      </section>
    </main>
  );
}
