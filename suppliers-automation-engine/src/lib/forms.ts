// Central configuration for the six Phase 1 supplier intake forms.
//
// Each form is rendered by the shared <IntakeForm> component and submitted to
// the placeholder Airtable API route. Keeping the definitions here means a new
// form is just another entry in this array — no bespoke page logic required.

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "textarea"
  | "select"
  | "date";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for `select`
  helpText?: string;
}

export interface IntakeFormConfig {
  /** URL slug, also used as the Airtable table name. */
  slug: string;
  title: string;
  description: string;
  /** Whether a confirmation SMS should be requested on submit (placeholder). */
  notifyBySms?: boolean;
  fields: FormField[];
}

export const INTAKE_FORMS: IntakeFormConfig[] = [
  {
    slug: "supplier-onboarding",
    title: "Supplier Onboarding",
    description: "Register a new supplier and capture core company details.",
    notifyBySms: true,
    fields: [
      { name: "companyName", label: "Company name", type: "text", required: true },
      { name: "contactName", label: "Primary contact", type: "text", required: true },
      { name: "email", label: "Contact email", type: "email", required: true },
      { name: "phone", label: "Contact phone", type: "tel", required: true },
      { name: "website", label: "Website", type: "text", placeholder: "https://" },
      {
        name: "category",
        label: "Supplier category",
        type: "select",
        required: true,
        options: ["Materials", "Equipment", "Logistics", "Services", "Other"],
      },
      { name: "taxId", label: "Tax / EIN", type: "text" },
      { name: "notes", label: "Additional notes", type: "textarea" },
    ],
  },
  {
    slug: "product-catalog",
    title: "Product Catalog Submission",
    description: "Submit a product or SKU for inclusion in the catalog.",
    fields: [
      { name: "supplierName", label: "Supplier name", type: "text", required: true },
      { name: "sku", label: "SKU", type: "text", required: true },
      { name: "productName", label: "Product name", type: "text", required: true },
      {
        name: "unitPrice",
        label: "Unit price (USD)",
        type: "number",
        required: true,
      },
      { name: "moq", label: "Minimum order quantity", type: "number" },
      { name: "leadTimeDays", label: "Lead time (days)", type: "number" },
      { name: "description", label: "Product description", type: "textarea" },
    ],
  },
  {
    slug: "quote-request",
    title: "Quote Request (RFQ)",
    description: "Request a quote from one or more suppliers.",
    notifyBySms: true,
    fields: [
      { name: "requesterName", label: "Your name", type: "text", required: true },
      { name: "email", label: "Your email", type: "email", required: true },
      { name: "item", label: "Item / service needed", type: "text", required: true },
      { name: "quantity", label: "Quantity", type: "number", required: true },
      { name: "neededBy", label: "Needed by", type: "date" },
      {
        name: "urgency",
        label: "Urgency",
        type: "select",
        options: ["Standard", "Expedited", "Critical"],
      },
      { name: "details", label: "Requirements & details", type: "textarea" },
    ],
  },
  {
    slug: "purchase-order",
    title: "Purchase Order Intake",
    description: "Submit a purchase order for processing.",
    notifyBySms: true,
    fields: [
      { name: "poNumber", label: "PO number", type: "text", required: true },
      { name: "supplierName", label: "Supplier", type: "text", required: true },
      { name: "buyerEmail", label: "Buyer email", type: "email", required: true },
      { name: "totalAmount", label: "Total amount (USD)", type: "number", required: true },
      { name: "currency", label: "Currency", type: "text", placeholder: "USD" },
      { name: "deliveryDate", label: "Requested delivery date", type: "date" },
      { name: "lineItems", label: "Line items", type: "textarea", helpText: "One item per line: SKU x qty" },
    ],
  },
  {
    slug: "invoice-submission",
    title: "Invoice Submission",
    description: "Suppliers submit invoices against a purchase order.",
    fields: [
      { name: "invoiceNumber", label: "Invoice number", type: "text", required: true },
      { name: "supplierName", label: "Supplier", type: "text", required: true },
      { name: "poNumber", label: "Related PO number", type: "text", required: true },
      { name: "amount", label: "Invoice amount (USD)", type: "number", required: true },
      { name: "invoiceDate", label: "Invoice date", type: "date", required: true },
      { name: "dueDate", label: "Due date", type: "date" },
      { name: "remarks", label: "Remarks", type: "textarea" },
    ],
  },
  {
    slug: "support-ticket",
    title: "Supplier Support Ticket",
    description: "Report an issue or request support related to a supplier.",
    notifyBySms: true,
    fields: [
      { name: "submitterName", label: "Your name", type: "text", required: true },
      { name: "email", label: "Your email", type: "email", required: true },
      { name: "supplierName", label: "Supplier involved", type: "text" },
      {
        name: "priority",
        label: "Priority",
        type: "select",
        required: true,
        options: ["Low", "Medium", "High", "Urgent"],
      },
      { name: "subject", label: "Subject", type: "text", required: true },
      { name: "description", label: "Describe the issue", type: "textarea", required: true },
    ],
  },
];

export function getFormBySlug(slug: string): IntakeFormConfig | undefined {
  return INTAKE_FORMS.find((form) => form.slug === slug);
}
