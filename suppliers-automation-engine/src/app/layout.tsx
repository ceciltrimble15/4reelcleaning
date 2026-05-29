import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suppliers Automation Engine",
  description:
    "Phase 1 foundation — supplier intake forms with Airtable, Twilio, and email integrations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold text-brand-dark">
              Suppliers Automation Engine
            </Link>
            <nav className="text-sm">
              <Link
                href="/forms"
                className="font-medium text-brand hover:text-brand-dark"
              >
                Intake forms
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-slate-500">
            Phase 1 foundation. Integrations are placeholders.
          </div>
        </footer>
      </body>
    </html>
  );
}
