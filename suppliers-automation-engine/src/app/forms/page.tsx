import Link from "next/link";
import { INTAKE_FORMS } from "@/lib/forms";

export const metadata = {
  title: "Intake forms — Suppliers Automation Engine",
};

export default function FormsIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Intake forms</h1>
        <p className="mt-1 text-slate-600">
          Select a form to submit supplier information.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {INTAKE_FORMS.map((form) => (
          <li key={form.slug}>
            <Link
              href={`/forms/${form.slug}`}
              className="block rounded-lg border border-slate-200 bg-white p-5 transition hover:border-brand hover:shadow-sm"
            >
              <h2 className="font-semibold text-slate-900">{form.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{form.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-brand">
                Open form →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
