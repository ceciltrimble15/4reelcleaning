import IntakeForm from "@/components/forms/IntakeForm";
import type { IntakeFormConfig } from "@/components/forms/types";

const config: IntakeFormConfig = {
  title: "Young Adult Intake (18–24)",
  description:
    "Intake form for young adult participants ages 18 to 24.",
  table: "YoungAdults",
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
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    {
      name: "employmentStatus",
      label: "Employment Status",
      type: "select",
      options: [
        { label: "Employed", value: "employed" },
        { label: "Unemployed", value: "unemployed" },
        { label: "Student", value: "student" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "educationLevel",
      label: "Highest Education Level",
      type: "select",
      options: [
        { label: "Some High School", value: "some_high_school" },
        { label: "High School Diploma / GED", value: "high_school" },
        { label: "Some College", value: "some_college" },
        { label: "College Degree", value: "college" },
      ],
    },
    {
      name: "goals",
      label: "Goals",
      type: "textarea",
      helpText: "What are you hoping to achieve through the program?",
    },
    {
      name: "consent",
      label: "I consent to enrollment and to being contacted.",
      type: "checkbox",
      required: true,
    },
  ],
};

export default function YoungAdultFormPage() {
  return <IntakeForm config={config} />;
}
