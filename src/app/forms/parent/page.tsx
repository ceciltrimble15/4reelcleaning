import IntakeForm from "@/components/forms/IntakeForm";
import type { IntakeFormConfig } from "@/components/forms/types";

const config: IntakeFormConfig = {
  title: "Parent / Guardian Intake",
  description:
    "Intake form for a parent or legal guardian enrolling a youth participant.",
  table: "Parents",
  fields: [
    { name: "firstName", label: "First Name", type: "text", required: true },
    { name: "lastName", label: "Last Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    {
      name: "relationship",
      label: "Relationship to Youth",
      type: "select",
      required: true,
      options: [
        { label: "Parent", value: "parent" },
        { label: "Legal Guardian", value: "guardian" },
        { label: "Grandparent", value: "grandparent" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "youthName",
      label: "Youth Name(s)",
      type: "text",
      helpText: "Name of the youth participant(s) you are enrolling.",
    },
    {
      name: "preferredContact",
      label: "Preferred Contact Method",
      type: "select",
      options: [
        { label: "Email", value: "email" },
        { label: "Phone", value: "phone" },
        { label: "Text / SMS", value: "sms" },
      ],
    },
    {
      name: "address",
      label: "Mailing Address",
      type: "textarea",
    },
    {
      name: "notes",
      label: "Anything else we should know?",
      type: "textarea",
    },
  ],
};

export default function ParentFormPage() {
  return <IntakeForm config={config} />;
}
