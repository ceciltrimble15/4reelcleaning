import Link from "next/link";
import { notFound } from "next/navigation";
import { INTAKE_FORMS, getFormBySlug } from "@/lib/forms";
import { IntakeForm } from "@/components/IntakeForm";

export function generateStaticParams() {
  return INTAKE_FORMS.map((form) => ({ slug: form.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const form = getFormBySlug(params.slug);
  return { title: form ? `${form.title} — Suppliers Automation Engine` : "Form not found" };
}

export default function FormPage({ params }: { params: { slug: string } }) {
  const form = getFormBySlug(params.slug);
  if (!form) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/forms" className="text-sm text-brand hover:text-brand-dark">
        ← All forms
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{form.title}</h1>
        <p className="mt-1 text-slate-600">{form.description}</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <IntakeForm config={form} />
      </div>
    </div>
  );
}
