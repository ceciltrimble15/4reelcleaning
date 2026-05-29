import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A1 Suppliers Automation Engine",
  description:
    "Automation engine foundation: intake forms and integration scaffolding.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
