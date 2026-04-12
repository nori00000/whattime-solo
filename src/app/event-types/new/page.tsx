import Link from "next/link";

import { requireHostPageSession } from "@/lib/auth/server-session";
import { EventTypeForm } from "@/components/event-types/event-type-form";

export default async function NewEventTypePage() {
  await requireHostPageSession();

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Host Setup
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            Create your first event type
          </h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            This is the first host-side form. It intentionally stays narrow so
            the booking pipeline can be exercised before a richer availability
            editor is added.
          </p>
        </section>

        <EventTypeForm mode="create" />

        <Link
          href="/dashboard"
          className="inline-flex w-fit rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-white"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
