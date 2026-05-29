# A1 Suppliers Automation Engine

Phase 1 foundation for the suppliers automation engine: a Vercel-ready
Next.js app with public intake forms and placeholder API routes for
Airtable, Twilio (SMS), and email notifications.

> **Scope note:** This is the automation engine foundation only. The YEP app,
> mobile screens, rewards, mentor maps, and AI chat are intentionally **not**
> part of this phase.

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS**
- Deploys to **Vercel** with zero extra config

## Project structure

```
src/
  app/
    layout.tsx              # Root layout + global styles
    page.tsx                # Landing page linking to all intake forms
    globals.css
    forms/
      contact/              # General Contact
      youth/                # Youth Intake (7–17)
      parent/               # Parent / Guardian Intake
      young-adult/          # Young Adult Intake (18–24)
      mentor/               # Mentor Intake
      donor-partner/        # Donor / Partner Interest
    api/
      airtable/route.ts     # Placeholder: record creation
      twilio/route.ts       # Placeholder: SMS dispatch
      email/route.ts        # Placeholder: email notifications
  components/
    forms/
      IntakeForm.tsx        # Reusable declarative form renderer
      types.ts              # Form + field config types
  lib/
    env.ts                  # Type-safe env access + "configured?" helpers
docs/
  airtable-schema.md        # Airtable data model (8 tables)
.env.example                # Required environment variables
```

## Setup

Requirements: Node.js 18.17+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file and fill in values
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

The app runs at http://localhost:3000. The home page links to all six
intake forms.

Useful scripts:

| Script              | Purpose                       |
| ------------------- | ----------------------------- |
| `npm run dev`       | Start the dev server          |
| `npm run build`     | Production build              |
| `npm start`         | Run the production build      |
| `npm run lint`      | ESLint                        |
| `npm run typecheck` | TypeScript check (`tsc`)      |

## Environment variables

Copy `.env.example` to `.env.local` (gitignored) for local dev, and set the
same variables in **Vercel → Project Settings → Environment Variables** for
deployments. **Never commit real secrets.**

| Variable              | Used by | Description                                      |
| --------------------- | ------- | ------------------------------------------------ |
| `AIRTABLE_API_KEY`    | Airtable| Personal access token (`pat...`) scoped to base  |
| `AIRTABLE_BASE_ID`    | Airtable| Base identifier (`app...`)                       |
| `TWILIO_ACCOUNT_SID`  | Twilio  | Account SID (`AC...`)                            |
| `TWILIO_AUTH_TOKEN`   | Twilio  | Account auth token                               |
| `TWILIO_PHONE_NUMBER` | Twilio  | Sending number in E.164 (`+15551234567`)         |
| `EMAIL_PROVIDER`      | Email   | Provider id (`resend`, `sendgrid`, `smtp`, …)    |
| `EMAIL_FROM`          | Email   | Default From address                             |

Until a given integration's variables are set, its API route validates the
request and returns `202 Accepted` with `persisted/sent: false` so the UI
flow still works during development.

## Airtable structure

The data model defines **8 tables** in a single base:

`Contacts`, `Youth`, `Parents`, `YoungAdults`, `Mentors`, `Partners`,
`Donors`, and `Messages`.

Each intake form maps to exactly one table; the `Messages` table is an
append-only log written by the Twilio and email routes. Full field
definitions, conventions, and relationships are documented in
[`docs/airtable-schema.md`](docs/airtable-schema.md).

> Phase 1 ships the **schema design** and the form/route contract. The live
> Airtable write is stubbed and lands in a later phase.

## Twilio structure

The `/api/twilio` route is the single entry point for outbound SMS. It
expects a JSON body:

```json
{ "to": "+15551234567", "body": "Your message text" }
```

In Phase 1 it validates the payload and reports whether Twilio is configured
(`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`). The real
send and the `Messages` log write are implemented in a later phase. Email
notifications work the same way via `/api/email`:

```json
{ "to": "person@example.org", "subject": "Subject", "body": "Body" }
```

## Deployment process

Deploys to **Vercel**:

1. Import the GitHub repo into Vercel (Framework preset: **Next.js**, detected
   automatically).
2. Add the environment variables above under **Settings → Environment
   Variables** for the Production (and Preview) environments.
3. Vercel builds with `npm run build` and deploys on every push. Pushes to a
   PR branch create **Preview** deployments; merges to the default branch
   deploy to **Production**.

No additional configuration files are required — the standard Next.js
structure is Vercel-ready out of the box.

## Contributing workflow

1. Develop on a feature branch.
2. Commit in logical, descriptive steps.
3. Open a Pull Request and review before merging.
