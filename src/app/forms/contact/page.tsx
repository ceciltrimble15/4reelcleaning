import IntakeForm from "@/components/forms/IntakeForm";
import type { IntakeFormConfig } from "@/components/forms/types";

const config: IntakeFormConfig = {
  title: "General Contact",
  description: "Have a question? Send us a message and we'll get back to you.",
  table: "Contacts",
  fields: [
    { name: "fullName", label: "Full Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel" },
    {
      name: "subject",
      label: "Subject",
      type: "text",
      placeholder: "What is this about?",
    },
    {
      name: "message",
      label: "Message",
      type: "textarea",
      required: true,
    },
  ],
};

export default function ContactFormPage() {
  return <IntakeForm config={config} />;
}
