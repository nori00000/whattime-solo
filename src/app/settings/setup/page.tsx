import Link from "next/link";

import { getSetupReadiness } from "@/server/services/setup-service";
import { requireHostPageSession } from "@/lib/auth/server-session";

export default async function SetupReadinessPage() {
  await requireHostPageSession();
  const readiness = getSetupReadiness();

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Setup Readiness
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            Environment and integration prerequisites
          </h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            This page shows what is still missing before the app can be tested
            against a real database, live Google OAuth, and email delivery.
          </p>
          <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-700">
            Configured {readiness.configuredCount} / {readiness.totalCount}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
            <p className="text-sm font-semibold text-stone-950">Database</p>
            <p className="mt-3 text-sm text-stone-600">
              {readiness.readyForDatabase ? "Ready" : "Missing DATABASE_URL"}
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
            <p className="text-sm font-semibold text-stone-950">Live auth</p>
            <p className="mt-3 text-sm text-stone-600">
              {readiness.readyForLiveAuth
                ? "Ready"
                : "Missing one or more OAuth/session keys"}
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
            <p className="text-sm font-semibold text-stone-950">Email</p>
            <p className="mt-3 text-sm text-stone-600">
              {readiness.readyForEmail ? "Ready" : "Missing email configuration"}
            </p>
          </article>
        </section>

        <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
          <p className="text-sm font-semibold text-stone-950">
            Required environment variables
          </p>
          <div className="mt-5 grid gap-3">
            {readiness.env.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm text-stone-700"
              >
                <span className="font-medium text-stone-950">{item.key}</span>
                <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-stone-600">
                  {item.configured ? "Configured" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-white"
          >
            Back to dashboard
          </Link>
          <Link
            href="/settings/calendars"
            className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Calendar settings
          </Link>
        </div>
      </div>
    </main>
  );
}
