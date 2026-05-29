# Suppliers Automation Engine — Phase 1 Foundation

A Next.js 14 application that provides the supplier intake surface and the
integration scaffolding for the Suppliers Automation Engine.

This is the **Phase 1 foundation** only. It deliberately does **not** include:
the YEP app, AI features, rewards, or mentor maps.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- TypeScript (strict)
- Tailwind CSS

## What's included

- **6 supplier intake forms**, all driven by a single config
  (`src/lib/forms.ts`) and a shared `<IntakeForm>` component:
  1. Supplier Onboarding
  2. Product Catalog Submission
  3. Quote Request (RFQ)
  4. Purchase Order Intake
  5. Invoice Submission
  6. Supplier Support Ticket
- **Placeholder API routes** (validate input, return placeholder responses,
  no external calls yet):
  - `POST /api/airtable` — persists intake submissions
  - `POST /api/twilio` — sends confirmation SMS
  - `POST /api/email` — sends transactional email
- `.env.example` documenting all required credentials
- `docs/airtable-schema.md` describing the intended Airtable base layout

## Getting started

```bash
cd suppliers-automation-engine
npm install
cp .env.example .env.local   # optional in Phase 1 — routes work without it
npm run dev
```

Then open http://localhost:3000 and visit **/forms**.

## Scripts

| Script              | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start the dev server         |
| `npm run build`     | Production build             |
| `npm run start`     | Run the production build     |
| `npm run lint`      | ESLint (next/core-web-vitals)|
| `npm run typecheck` | TypeScript type-check        |

## Project structure

```
suppliers-automation-engine/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── airtable/route.ts   # placeholder
│   │   │   ├── twilio/route.ts     # placeholder
│   │   │   └── email/route.ts      # placeholder
│   │   ├── forms/
│   │   │   ├── page.tsx            # forms index
│   │   │   └── [slug]/page.tsx     # individual form
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── IntakeForm.tsx
│   │   └── Field.tsx
│   └── lib/
│       └── forms.ts                # the 6 form definitions
├── docs/
│   └── airtable-schema.md
└── .env.example
```

## Integrations

All three integrations are placeholders. Each route checks whether the
relevant environment variables are set and reports `configured: true/false`
in its response, but does not yet make external calls. Phase 2 will replace
the placeholder bodies with real Airtable / Twilio / email logic. See
`.env.example` and `docs/airtable-schema.md`.
