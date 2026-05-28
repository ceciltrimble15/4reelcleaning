# A/1 Suppliers — Phase 1 Intake Communication Engine

> Supplying the Tools. Supporting the Hustle.

This is the **Phase 1** automation foundation for A/1 Suppliers: a single
endpoint that turns any intake submission (YEP youth, parent/guardian, young
adult, mentor, volunteer, sponsor, partner, general contact) into a structured,
logged, de-duplicated follow-up across **Airtable + Email + SMS + internal
alert**.

Nothing here is disconnected: one submission → CRM record → classification →
welcome email → welcome SMS → internal alert → status/follow-up update → full
automation log.

This build intentionally stops at the **intake engine**. No dashboards, no
scheduled sequences, no app sync, no website redesign — those are Phases 2–5.

---

## 1. Architecture decision

**Audit finding.** The repository was a single static marketing page
(`index.html`, ~890 KB) plus `README.md`. There is **no** existing framework,
build step, `package.json`, or serverless configuration — so the repo does
**not** currently support API/serverless routes.

**Decision.** Add a **self-contained Node.js service in `/backend`** with
**zero runtime dependencies** (Node ≥18 built-in `http` + `fetch`). Rationale:

- **Keeps it connected, not coupled.** It lives in the same repo as the site
  (system principle: nothing disconnected) but is isolated in `/backend` so it
  cannot break the static page.
- **Host-agnostic & safe.** Zero dependencies = no supply-chain surface, no
  `npm install` required to run, and it deploys equally well as a long-running
  service (Render/Railway/Fly/VM) **or** as a serverless function.
- **Serverless-ready.** `/api/intake-webhook.js` is a Vercel/Netlify-style
  function that reuses the exact same core handler, so behavior is identical in
  either deployment model.

The static site stays untouched; when ready, the website form simply POSTs to
`/api/intake-webhook`.

---

## 2. Files created

```
backend/
  package.json              # zero-dependency, ESM, npm scripts
  .env.example              # all required env vars (documented)
  .gitignore
  README.md                 # this file (full Phase 1 report)
  src/
    config.js               # env loading + per-provider readiness + dry-run
    handler.js              # core PRIMARY WORKFLOW orchestration (framework-agnostic)
    server.js               # standalone HTTP server (built-in http module)
    services/
      classify.js           # classifyContact() + age-group logic + CONTACT_TYPES
      airtable.js           # CRM + Automation_Log (REST); in-memory store for dry-run
      email.js              # Resend/SendGrid sender + welcome/internal-alert helpers
      twilio.js             # SMS sender + per-category send functions
    templates/
      email.js              # 8 welcome templates + internal alert (brand voice)
      sms.js                # 8 SMS templates (brand voice)
    utils/
      validate.js           # email/phone validation, sanitization, consent parsing
  test/
    payloads.js             # 8 test payloads (one per contact type)
    test-intake.js          # dry-run test runner (55 assertions)
api/
  intake-webhook.js         # serverless wrapper -> backend/src/handler.js
```

---

## 3. API endpoints

| Method | Path                   | Purpose                                  |
| ------ | ---------------------- | ---------------------------------------- |
| `POST` | `/api/intake-webhook`  | Main intake → CRM + email + SMS + alert  |
| `GET`  | `/health`              | Liveness check                           |

**Request body** (`application/json`) — all fields optional except a name and
at least one channel (email/phone, or a parent's for minors):

```json
{
  "fullName": "Jaylen Carter",
  "email": "jaylen@example.com",
  "phone": "(513) 555-0107",
  "age": 13,
  "category": "Youth",
  "interest": "YEP cohort",
  "parentName": "Tasha Carter",
  "parentEmail": "tasha@example.com",
  "parentPhone": "513-555-0108",
  "source": "website-intake",
  "consent": "yes",
  "message": "I want to join YEP."
}
```

`category` is optional — if omitted it is inferred from `role`/`interest`/`age`.
Accepted categories (and aliases): `Youth 7-17`, `Parent/Guardian`,
`Young Adult 18-24`, `Mentor`, `Volunteer`, `Sponsor`, `Partner`,
`General Contact`.

**Success response:**

```json
{
  "ok": true,
  "contactId": "recXXXX",
  "category": "Youth 7-17",
  "duplicate": false,
  "actions": [ { "actionType": "welcome-email", "provider": "resend", "status": "sent" }, ... ]
}
```

---

## 4. Airtable requirements

### Table: `A1_SUPPLIERS_CONTACTS` (master CRM)

| Field                   | Type                     | Notes                                  |
| ----------------------- | ------------------------ | -------------------------------------- |
| Full Name               | Single line text         | Required                               |
| Email                   | Email                    | Used for duplicate match               |
| Phone                   | Phone number             | Used for duplicate match (E.164)       |
| Category                | Single select            | The 8 contact types                    |
| Age                     | Number                   |                                        |
| Age Group               | Single select / text     | `YEP (7-17)`, `Y-A.E.P. (18-24)`, etc. |
| Parent/Guardian Name    | Single line text         |                                        |
| Parent/Guardian Email   | Email                    |                                        |
| Parent/Guardian Phone   | Phone number             |                                        |
| Interest Area           | Single line text         |                                        |
| Source                  | Single line text         | e.g. `website-intake`                  |
| Message                 | Long text                |                                        |
| Consent                 | Checkbox                 |                                        |
| Status                  | Single select            | `New`, `Contacted`, `Re-engaged`, ...  |
| Tags                    | Single line text / multi |                                        |
| Welcome Email Sent      | Checkbox                 | Duplicate protection                   |
| SMS Sent                | Checkbox                 | Duplicate protection                   |
| Internal Alert Sent     | Checkbox                 | Duplicate protection                   |
| Follow-Up Stage         | Single select            | `Stage 1 - Welcome`, ...               |
| Next Follow-Up Date     | Date                     |                                        |
| Last Contacted          | Date / Date-time         |                                        |
| Automation Notes        | Long text                |                                        |

### Table: `Automation_Log`

| Field             | Type             |
| ----------------- | ---------------- |
| Contact ID        | Single line text |
| Category          | Single line text |
| Action Type       | Single line text |
| Provider          | Single line text |
| Status            | Single line text |
| Timestamp         | Date-time / text |
| Provider Response | Long text        |
| Error Message     | Long text        |

> Single-select options are created automatically because writes use Airtable
> `typecast: true`. You can pre-create them for cleaner option ordering.

---

## 5. Twilio requirements

- A Twilio account with `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`.
- One SMS-capable sending number in `TWILIO_PHONE_NUMBER` (E.164, e.g. `+1513...`).
- No SDK required — the service calls the Twilio REST Messages API directly.
- Per-category senders are implemented: `sendYouthSMS`, `sendParentSMS`,
  `sendYoungAdultSMS`, `sendMentorSMS`, `sendVolunteerSMS`, `sendSponsorSMS`,
  `sendPartnerSMS`, `sendGeneralSMS`.

---

## 6. Email requirements

- Default provider **Resend** (`EMAIL_PROVIDER_API_KEY`, `re_...`). Set
  `EMAIL_PROVIDER=sendgrid` to use SendGrid with the same key variable.
- Verify your sending domain and set `EMAIL_FROM_ADDRESS` accordingly.
- Templates: Youth Welcome, Parent Welcome, Young Adult Welcome, Mentor
  Welcome, Volunteer Welcome, Sponsor Thank You, Partner Thank You, General
  Confirmation, and the **Internal Alert** to `INTERNAL_ALERT_EMAIL`
  (`info@a1suppliers.org`).
- All submitted text is HTML-escaped in templates (no markup injection).

---

## 7. Duplicate protection (confirmed)

Before sending any welcome:

1. `findDuplicateByEmailOrPhone()` looks up the contact by **email or phone**.
2. If found, the existing record's **`Welcome Email Sent`** and **`SMS Sent`**
   flags are read.
3. A welcome that was already sent is **skipped** (`skipped-duplicate`) — never
   re-sent. The internal alert is likewise gated by `Internal Alert Sent`.
4. The original intake record is **never overwritten or deleted**; a duplicate
   resubmission only updates status/`Last Contacted`/notes and fills blanks.

Verified by the test suite (`duplicate detected on resubmit`, welcome email &
SMS `skipped-duplicate`).

---

## 8. Logging (confirmed)

Every action writes one row to `Automation_Log` via `logAutomationAction()`
with: `Contact ID`, `Category`, `Action Type`, `Provider`, `Status`,
`Timestamp`, `Provider Response`, `Error Message`. Logging never throws — a
logging failure cannot break the intake flow (falls back to `stderr`).

---

## 9. Test results

Run from `backend/`:

```bash
npm test
```

Latest run: **55 passed, 0 failed**, covering:

- All **8 contact types** classified correctly and processed (200 + email +
  SMS + internal alert simulated).
- **Duplicate protection** (resubmit detected; welcome email & SMS skipped).
- **Validation** (missing name / bad email / bad phone → HTTP 400).
- **Logging** (Automation_Log rows written).

Tests run in `AUTOMATION_DRY_RUN` mode, so no live messages are sent and no
credentials are needed.

---

## 10. Deployment instructions

### Local

```bash
cd backend
cp .env.example .env        # fill in real keys (or leave blank to simulate)
npm start                   # -> http://localhost:3000/api/intake-webhook
# safe simulation:
AUTOMATION_DRY_RUN=true npm start
```

### As a long-running service (Render / Railway / Fly / VM)

- Start command: `node src/server.js` (root: `backend/`).
- Set all env vars from `.env.example` in the host's dashboard.
- Point the website form / Airtable / form tool webhook at
  `https://<your-host>/api/intake-webhook`.

### As a serverless function (Vercel / Netlify)

- `api/intake-webhook.js` is the function entry (reuses the same handler).
- Configure env vars in the platform dashboard.
- Ensure the function bundle can resolve `backend/src/*` (include it in the
  deployment, or vendor `backend/src` next to the function).

**Security:** all provider keys are read from env and used **server-side only**;
they are never sent to the browser. Validate/ sanitize is enforced on every
submission, and records are never deleted or overwritten.

---

## 11. Remaining requirements from Cecil

To go fully live, Cecil (or the team) needs to provide / confirm:

1. **Airtable**: Personal Access Token, Base ID, and confirm the two tables
   (`A1_SUPPLIERS_CONTACTS`, `Automation_Log`) exist with the fields in §4.
2. **Twilio**: Account SID, Auth Token, and a verified SMS sending number.
3. **Email**: Resend (or SendGrid) API key **and a verified sending domain**
   for `a1suppliers.org`; confirm the `EMAIL_FROM_ADDRESS`.
4. **Internal alert inbox**: confirm `info@a1suppliers.org` is monitored.
5. **Hosting choice**: long-running service vs. serverless (affects where env
   vars live and the webhook URL).
6. **Final copy approval**: review the 8 email + 8 SMS templates for tone/brand.
7. **Website wiring** (separate, Phase-1-adjacent task): add the intake form to
   the site and POST to the deployed endpoint — not done here to avoid
   redesigning the site.

Out of scope for Phase 1 (do not build yet): scheduled follow-up sequences
(Phase 2), cohort/FINISHER tracking (Phase 3), app sync (Phase 4), dashboards &
analytics (Phase 5).
