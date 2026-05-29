import Link from "next/link";

const forms = [
  {
    href: "/forms/contact",
    title: "General Contact",
    description: "For general questions and inquiries.",
  },
  {
    href: "/forms/youth",
    title: "Youth Intake (7–17)",
    description: "Intake for youth participants ages 7 to 17.",
  },
  {
    href: "/forms/parent",
    title: "Parent / Guardian Intake",
    description: "Intake for a parent or legal guardian.",
  },
  {
    href: "/forms/young-adult",
    title: "Young Adult Intake (18–24)",
    description: "Intake for young adult participants ages 18 to 24.",
  },
  {
    href: "/forms/mentor",
    title: "Mentor Intake",
    description: "Application for prospective mentors.",
  },
  {
    href: "/forms/donor-partner",
    title: "Donor / Partner Interest",
    description: "Express interest in donating or partnering.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          A1 Suppliers Automation Engine
        </h1>
        <p className="mt-3 text-slate-600">
          Phase 1 foundation. Select an intake form to get started.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {forms.map((form) => (
          <Link
            key={form.href}
            href={form.href}
            className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {form.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{form.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
