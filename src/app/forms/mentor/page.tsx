import IntakeForm from "@/components/forms/IntakeForm";
import type { IntakeFormConfig } from "@/components/forms/types";

const config: IntakeFormConfig = {
  title: "Mentor Intake",
  description:
    "Application for prospective mentors. Tell us about yourself and how you'd like to help.",
  table: "Mentors",
  fields: [
    { name: "firstName", label: "First Name", type: "text", required: true },
    { name: "lastName", label: "Last Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    { name: "occupation", label: "Occupation", type: "text" },
    {
      name: "areasOfExpertise",
      label: "Areas of Expertise",
      type: "textarea",
      helpText: "Skills, industries, or subjects you can mentor in.",
    },
    {
      name: "availability",
      label: "Availability",
      type: "select",
      options: [
        { label: "Weekdays", value: "weekdays" },
        { label: "Weekends", value: "weekends" },
        { label: "Evenings", value: "evenings" },
        { label: "Flexible", value: "flexible" },
      ],
    },
    {
      name: "experience",
      label: "Prior Mentoring / Volunteer Experience",
      type: "textarea",
    },
    {
      name: "backgroundCheckConsent",
      label: "I consent to a background check.",
      type: "checkbox",
      required: true,
    },
  ],
};

export default function MentorFormPage() {
  return <IntakeForm config={config} />;
}
