import type { FormField } from "@/lib/forms";

const baseInput =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export function Field({ field }: { field: FormField }) {
  const id = `field-${field.name}`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={id}
          name={field.name}
          required={field.required}
          placeholder={field.placeholder}
          rows={4}
          className={baseInput}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          name={field.name}
          required={field.required}
          defaultValue=""
          className={baseInput}
        >
          <option value="" disabled>
            Select…
          </option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.name}
          type={field.type}
          required={field.required}
          placeholder={field.placeholder}
          className={baseInput}
        />
      )}

      {field.helpText && (
        <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>
      )}
    </div>
  );
}
