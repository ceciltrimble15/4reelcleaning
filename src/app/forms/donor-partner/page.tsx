import IntakeForm from "@/components/forms/IntakeForm";
import type { IntakeFormConfig } from "@/components/forms/types";

const config: IntakeFormConfig = {
  title: "Donor / Partner Interest",
  description:
    "Interested in supporting the program as a donor or partner organization? Let us know.",
  table: "Partners",
  fields: [
    {
      name: "interestType",
      label: "I am interested in",
      type: "select",
      required: true,
      helpText:
        "Donor submissions are recorded in the Donors table; partner submissions in the Partners table.",
      options: [
        { label: "Donating", value: "donor" },
        { label: "Partnering", value: "partner" },
        { label: "Both", value: "both" },
      ],
    },
    { name: "contactName", label: "Contact Name", type: "text", required: true },
    {
      name: "organization",
      label: "Organization (if applicable)",
      type: "text",
    },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel" },
    {
      name: "contributionType",
      label: "Type of Contribution",
      type: "select",
      options: [
        { label: "Financial", value: "financial" },
        { label: "In-Kind / Goods", value: "in_kind" },
        { label: "Services", value: "services" },
        { label: "Volunteer Hours", value: "volunteer" },
      ],
    },
    {
      name: "message",
      label: "Tell us more",
      type: "textarea",
      helpText: "How would you like to get involved?",
    },
  ],
};

export default function DonorPartnerFormPage() {
  return <IntakeForm config={config} />;
}
