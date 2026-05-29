"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import type { IntakeFormConfig, FormField } from "./types";

type SubmitState = "idle" | "submitting" | "success" | "error";

function Field({ field }: { field: FormField }) {
  const baseClasses =
    "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

  const label = (
    <label
      htmlFor={field.name}
      className="block text-sm font-medium text-slate-800"
    >
      {field.label}
      {field.required && <span className="ml-0.5 text-red-600">*</span>}
    </label>
  );

  return (
    <div>
      {field.type !== "checkbox" && label}

      {field.type === "textarea" ? (
        <textarea
          id={field.name}
          name={field.name}
          required={field.required}
          placeholder={field.placeholder}
          rows={4}
          className={baseClasses}
        />
      ) : field.type === "select" ? (
        <select
          id={field.name}
          name={field.name}
          required={field.required}
          defaultValue=""
          className={baseClasses}
        >
          <option value="" disabled>
            Select an option…
          </option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <label className="flex items-start gap-2">
          <input
            id={field.name}
            name={field.name}
            type="checkbox"
            required={field.required}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
          />
          <span className="text-sm text-slate-800">
            {field.label}
            {field.required && <span className="ml-0.5 text-red-600">*</span>}
          </span>
        </label>
      ) : (
        <input
          id={field.name}
          name={field.name}
          type={field.type}
          required={field.required}
          placeholder={field.placeholder}
          className={baseClasses}
        />
      )}

      {field.helpText && (
        <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>
      )}
    </div>
  );
}

export default function IntakeForm({ config }: { config: IntakeFormConfig }) {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const fields: Record<string, string> = {};
    formData.forEach((value, key) => {
      fields[key] = value.toString();
    });

    try {
      const response = await fetch("/api/airtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: config.table, fields }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setState("success");
      setMessage("Thanks! Your submission was received.");
      event.currentTarget.reset();
    } catch (error) {
      setState("error");
      setMessage(
        "Something went wrong submitting the form. Please try again later.",
      );
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/"
        className="text-sm font-medium text-brand hover:underline"
      >
        ← All forms
      </Link>

      <header className="mb-8 mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {config.title}
        </h1>
        <p className="mt-2 text-slate-600">{config.description}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {config.fields.map((field) => (
          <Field key={field.name} field={field} />
        ))}

        <button
          type="submit"
          disabled={state === "submitting"}
          className="rounded-md bg-brand px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? "Submitting…" : "Submit"}
        </button>

        {message && (
          <p
            role="status"
            className={
              state === "error"
                ? "text-sm font-medium text-red-600"
                : "text-sm font-medium text-green-700"
            }
          >
            {message}
          </p>
        )}
      </form>
    </main>
  );
}
