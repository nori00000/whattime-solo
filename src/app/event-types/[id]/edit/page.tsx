import Link from "next/link";
import { notFound } from "next/navigation";

import { EventTypeForm } from "@/components/event-types/event-type-form";
import { requireHostPageSession } from "@/lib/auth/server-session";
import { listEventTypes } from "@/server/services/event-type-service";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEventTypePage({ params }: Params) {
  const host = await requireHostPageSession();
  const resolvedParams = await params;
  const eventTypes = await listEventTypes(host.userId);
  const eventType = eventTypes.find((item) => item.id === resolvedParams.id);

  if (!eventType) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Edit Event Type
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            {eventType.title}
          </h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            This editor currently supports the main scalar fields. The full
            availability rule editor can be layered on top of the same form next.
          </p>
        </section>

        <EventTypeForm
          mode="edit"
          eventTypeId={eventType.id}
          initialValues={{
            title: eventType.title,
            description: eventType.description ?? "",
            durationMinutes: eventType.durationMinutes,
            bufferBeforeMinutes: eventType.bufferBeforeMinutes,
            bufferAfterMinutes: eventType.bufferAfterMinutes,
            minimumNoticeMinutes: eventType.minimumNoticeMinutes,
          }}
        />

        <div className="flex flex-wrap gap-3">
          <Link
            href="/event-types"
            className="inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-white"
          >
            Back to event types
          </Link>
          <Link
            href={`/${eventType.slug}`}
            className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Open public page
          </Link>
        </div>
      </div>
    </main>
  );
}
