"use client";

import { useState } from "react";
import type { IntakeFormConfig } from "@/lib/forms";
import { Field } from "./Field";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function IntakeForm({ config }: { config: IntakeFormConfig }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "submitting" });

    const formData = new FormData(event.currentTarget);
    const fields = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/airtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: config.slug, fields }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      // Fire-and-forget placeholder notification for forms that opt in.
      if (config.notifyBySms) {
        void fetch("/api/twilio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: fields.phone ?? "",
            message: `Received your ${config.title} submission.`,
          }),
        });
      }

      setStatus({
        kind: "success",
        message: "Submission received. (Placeholder — not yet persisted.)",
      });
      event.currentTarget.reset();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {config.fields.map((field) => (
        <Field key={field.name} field={field} />
      ))}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status.kind === "submitting"}
          className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {status.kind === "submitting" ? "Submitting…" : "Submit"}
        </button>

        {status.kind === "success" && (
          <p className="text-sm text-emerald-600">{status.message}</p>
        )}
        {status.kind === "error" && (
          <p className="text-sm text-red-600">{status.message}</p>
        )}
      </div>
    </form>
  );
}
