import Link from "next/link";

const planningDocs = [
  {
    path: "docs/product-spec.md",
    label: "Product Spec",
    summary: "Scope, goals, non-goals, booking rules, and release phases.",
  },
  {
    path: "docs/architecture-and-api.md",
    label: "Architecture and API",
    summary: "System layers, service boundaries, APIs, and observability plan.",
  },
  {
    path: "docs/rbac-guide.md",
    label: "RBAC Guide",
    summary:
      "Role model, ownership rules, token-scoped cancellation, and guard strategy.",
  },
  {
    path: "docs/operations.md",
    label: "Operations Guide",
    summary: "Runbooks, release checklist, and operator-friendly recovery paths.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-stone-100 text-stone-900">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12 sm:px-10">
        <section className="grid gap-8 rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-12">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Planning Baseline
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
              WhatTime Solo is set up as a planning-first scheduling app.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-stone-600">
              The next implementation milestone is foundation work only:
              database schema, role and ownership guards, environment contract,
              and project structure. Product logic starts after those pieces are
              locked.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-stone-600">
            <div className="rounded-full bg-stone-950 px-5 py-3 font-medium text-white">
              Repo docs are the current source of truth
            </div>
            <Link
              href="/dashboard"
              className="rounded-full border border-stone-300 px-5 py-3 font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
            >
              Host dashboard scaffold
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {planningDocs.map((doc) => (
            <article
              key={doc.path}
              className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6"
            >
              <p className="text-sm font-semibold text-stone-900">{doc.label}</p>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                {doc.summary}
              </p>
              <p className="mt-5 text-sm font-medium text-amber-700">{doc.path}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
