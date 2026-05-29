import IntakeForm from "@/components/forms/IntakeForm";
import type { IntakeFormConfig } from "@/components/forms/types";

const config: IntakeFormConfig = {
  title: "Youth Intake (7–17)",
  description:
    "Intake form for youth participants ages 7 to 17. A parent or guardian should help complete this form.",
  table: "Youth",
  fields: [
    { name: "firstName", label: "First Name", type: "text", required: true },
    { name: "lastName", label: "Last Name", type: "text", required: true },
    {
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
      required: true,
    },
    { name: "age", label: "Age", type: "number", required: true },
    {
      name: "gradeLevel",
      label: "Grade Level",
      type: "text",
      placeholder: "e.g. 6th grade",
    },
    { name: "schoolName", label: "School Name", type: "text" },
    {
      name: "guardianName",
      label: "Parent / Guardian Name",
      type: "text",
      required: true,
    },
    {
      name: "guardianEmail",
      label: "Parent / Guardian Email",
      type: "email",
      required: true,
    },
    {
      name: "guardianPhone",
      label: "Parent / Guardian Phone",
      type: "tel",
      required: true,
    },
    {
      name: "interests",
      label: "Interests / Goals",
      type: "textarea",
      helpText: "What would the youth like to get out of the program?",
    },
    {
      name: "consent",
      label: "I am the parent/guardian and consent to this enrollment.",
      type: "checkbox",
      required: true,
    },
  ],
};

export default function YouthFormPage() {
  return <IntakeForm config={config} />;
}
