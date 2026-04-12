import Link from "next/link";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-12 text-stone-900">
      <section className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Auth Scaffolding
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
          Google sign-in wiring is ready for credentials.
        </h1>
        <p className="mt-4 text-base leading-8 text-stone-600">
          The Auth.js route and Google provider are configured in code, but
          real login will remain blocked until valid OAuth credentials are set
          in the environment.
        </p>
        <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-700">
          Required next step:
          <br />
          <span className="font-medium text-stone-950">
            configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET,
            and NEXTAUTH_URL.
          </span>
        </div>

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
