// Shared types describing intake form configuration.
// Each intake form is defined declaratively and rendered by <IntakeForm />.

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "checkbox";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormField {
  /** Maps directly to an Airtable column name. */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  /** Options for "select" fields. */
  options?: FieldOption[];
}

export interface IntakeFormConfig {
  /** Human-readable title shown at the top of the form. */
  title: string;
  description: string;
  /** Airtable table this form writes to. See docs/airtable-schema.md. */
  table:
    | "Contacts"
    | "Youth"
    | "Parents"
    | "YoungAdults"
    | "Mentors"
    | "Partners"
    | "Donors";
  fields: FormField[];
}
