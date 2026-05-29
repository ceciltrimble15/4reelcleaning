# Claude Code Implementation Prompt

## Scope

Build a **backend connector only**.

- **Backend connector only.**
- **No UI.**
- **No public website pages.**
- **No YEP app.**
- **No FINISHER content.**

## Origins

| Purpose | URL |
| --- | --- |
| Existing website origin | https://a1suppliers.org |
| Allowed backup/test origin | https://a1-suppliers-website.vercel.app |

Configure CORS so that only these two origins are allowed to call the backend.

## Intake Endpoint

The existing website sends form submissions to:

```
POST /api/intake
```

On each submission the backend must:

1. Save the submission to Airtable.
2. Send a Twilio SMS.
3. Send an email confirmation/notification.
4. Log the actions.
5. Return success/failure.

## Airtable Tables

1. `A1_Suppliers_Contacts`
2. `Youth_Intake`
3. `Parent_Guardian_Intake`
4. `Mentor_Intake`
5. `Volunteer_Intake`
6. `Partner_Donor_Intake`
7. `Message_Log`

## Important

- Use **dry-run defaults** until real keys are added. No live Airtable writes,
  Twilio SMS, or emails should be sent until real credentials are configured;
  until then, log the intended actions instead.
