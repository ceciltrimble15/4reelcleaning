import Link from "next/link";
import { INTAKE_FORMS } from "@/lib/forms";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Suppliers Automation Engine
        </h1>
        <p className="max-w-2xl text-slate-600">
          Phase 1 foundation. This app provides the supplier intake surface and
          the integration scaffolding (Airtable, Twilio, email). Integration
          routes return placeholder responses until credentials and business
          logic are wired up.
        </p>
        <Link
          href="/forms"
          className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Browse intake forms
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {INTAKE_FORMS.length} intake forms
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {INTAKE_FORMS.map((form) => (
            <li key={form.slug}>
              <Link
                href={`/forms/${form.slug}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand hover:shadow-sm"
              >
                <h3 className="font-medium text-slate-900">{form.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {form.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
