# A1 Suppliers Automation Engine

Backend connector for A1 Suppliers. The existing website posts form submissions
to this service, which **saves to Airtable**, **sends a Twilio SMS**, **sends an
email confirmation/notification**, **logs every action into `Message_Log`**, and
**returns success/failure**.

> **Backend automation only.** No UI, no website pages, no app screens, no YEP
> content. See [`IMPLEMENTATION_PROMPT.md`](./IMPLEMENTATION_PROMPT.md) for the
> source-of-truth scope.

## Dry-run by default

The engine starts in **dry-run mode**. In dry-run it never calls a vendor — it
logs the action it *would* perform and returns a simulated id. A vendor only
goes live when `DRY_RUN=false` **and** that vendor's credentials are present, so
you can never accidentally call Airtable/Twilio/SMTP with missing keys.

Zero runtime dependencies: the server runs on Node's native `http` module, so it
boots with no `npm install`. Vendor SDKs (`airtable`, `twilio`, `nodemailer`)
are listed as **optional** dependencies and lazily loaded only when live.

## Requirements

- Node.js >= 18 (developed on Node 22)

## Quick start

```bash
cp .env.example .env        # optional; defaults are dry-run + correct CORS
npm start                   # boots on PORT (default 3000)
```

Verify and test:

```bash
npm run verify              # loads every module (build check)
npm test                    # boots server on an ephemeral port, hits all routes
```

## Routes

| Method | Path              | Purpose                                                        |
| ------ | ----------------- | -------------------------------------------------------------- |
| GET    | `/api/health`     | Liveness + dry-run posture + per-vendor readiness.             |
| POST   | `/api/intake`     | Website form submission → Airtable + SMS + email + log.        |
| POST   | `/api/sms/send`   | Direct SMS send via Twilio.                                    |
| POST   | `/api/email/send` | Direct email send via SMTP.                                    |

### `POST /api/intake` payload

`formType` selects the Airtable table. Accepted values (aliases in parens):

| `formType`                       | Airtable table              |
| -------------------------------- | --------------------------- |
| `contact` (`general`)            | `A1_Suppliers_Contacts`     |
| `youth`                          | `Youth_Intake`              |
| `parent_guardian` (`parent`)     | `Parent_Guardian_Intake`    |
| `mentor`                         | `Mentor_Intake`             |
| `volunteer`                      | `Volunteer_Intake`          |
| `partner_donor` (`partner`,`donor`) | `Partner_Donor_Intake`   |

Required: `formType`, `name`, and at least one of `email` / `phone`. Any extra
primitive fields are passed through to Airtable.

## Services

- **Airtable service** (`src/services/airtable.js`) — record creation per table.
- **Twilio service** (`src/services/twilio.js`) — SMS send.
- **Email service** (`src/services/email.js`) — SMTP send.
- **Message Log service** (`src/services/messageLog.js`) — structured audit
  rows into `Message_Log` + app log lines.
- **Validation service** (`src/services/validation.js`) — payload validation +
  form-type → table resolution.

## CORS

Only these origins may call the API from a browser:

- `https://a1suppliers.org`
- `https://a1-suppliers-website.vercel.app`

Override with `CORS_ALLOWED_ORIGINS` (comma-separated). Requests with no
`Origin` header (server-to-server, curl) are allowed.

## Environment variables

See [`.env.example`](./.env.example) for the full annotated list. Summary:

| Variable | Required to go live | Purpose |
| --- | --- | --- |
| `PORT` | no | HTTP port (default `3000`). |
| `NODE_ENV` | no | `development` / `production`. |
| `DRY_RUN` | no | `true` (default) simulates everything. Set `false` to go live. |
| `CORS_ALLOWED_ORIGINS` | no | Comma-separated allowlist (defaults to the two approved origins). |
| `AIRTABLE_API_KEY` | Airtable | API key / token. |
| `AIRTABLE_BASE_ID` | Airtable | Base id. |
| `AIRTABLE_TABLE_*` | no | Table name overrides (defaults match the 7 tables). |
| `TWILIO_ACCOUNT_SID` | Twilio | Account SID. |
| `TWILIO_AUTH_TOKEN` | Twilio | Auth token. |
| `TWILIO_FROM_NUMBER` | Twilio | Sending number. |
| `TWILIO_NOTIFY_NUMBER` | no | Internal notification number for intake alerts. |
| `SMTP_HOST` | Email | SMTP host. |
| `SMTP_PORT` | no | SMTP port (default `587`). |
| `SMTP_SECURE` | no | `true` for TLS-on-connect. |
| `SMTP_USER` | Email | SMTP username. |
| `SMTP_PASS` | Email | SMTP password. |
| `EMAIL_FROM` | no | From header. |
| `EMAIL_NOTIFY_TO` | no | Internal notification inbox. |

## curl test examples

Health:

```bash
curl -s http://localhost:3000/api/health | jq
```

Intake (youth):

```bash
curl -s -X POST http://localhost:3000/api/intake \
  -H 'Content-Type: application/json' \
  -d '{
    "formType": "youth",
    "name": "Jordan Example",
    "email": "jordan@example.com",
    "phone": "+1 555 123 4567",
    "message": "Interested in the youth program."
  }' | jq
```

Intake (partner/donor, alias):

```bash
curl -s -X POST http://localhost:3000/api/intake \
  -H 'Content-Type: application/json' \
  -d '{"formType":"donor","name":"Pat Donor","email":"pat@example.com"}' | jq
```

Direct SMS:

```bash
curl -s -X POST http://localhost:3000/api/sms/send \
  -H 'Content-Type: application/json' \
  -d '{"to":"+15551234567","body":"Hello from A1 Suppliers"}' | jq
```

Direct email:

```bash
curl -s -X POST http://localhost:3000/api/email/send \
  -H 'Content-Type: application/json' \
  -d '{"to":"someone@example.com","subject":"Hello","text":"Test message"}' | jq
```

CORS check (allowed origin echoes the header; a disallowed origin gets `403`):

```bash
curl -s -i http://localhost:3000/api/health -H 'Origin: https://a1suppliers.org' | grep -i access-control-allow-origin
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/health -H 'Origin: https://evil.example.com'
```

## Going live

1. Populate the relevant credentials in `.env`.
2. Set `DRY_RUN=false`.
3. Restart. `GET /api/health` will show `live: true` for each ready vendor.
