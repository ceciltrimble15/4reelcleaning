# Airtable Architecture

This document defines the **data model only** for the automation engine.
No automations, scripts, or live API wiring are included in Phase 1 — this is
the schema to create in Airtable and the contract the intake forms and API
routes are written against.

## Base overview

One Airtable **base** (`AIRTABLE_BASE_ID`) contains the following tables:

| Table         | Purpose                                             | Fed by form              |
| ------------- | --------------------------------------------------- | ------------------------ |
| `Contacts`    | General inquiries                                   | General Contact          |
| `Youth`       | Participants ages 7–17                              | Youth Intake             |
| `Parents`     | Parents / guardians of youth                        | Parent / Guardian Intake |
| `YoungAdults` | Participants ages 18–24                             | Young Adult Intake       |
| `Mentors`     | Prospective and active mentors                      | Mentor Intake            |
| `Partners`    | Partner organizations                               | Donor / Partner Interest |
| `Donors`      | Individual / org donors                             | Donor / Partner Interest |
| `Messages`    | Outbound/inbound message log (SMS + email)          | API routes               |

> Form-to-table mapping is enforced in code by the `table` field on each
> `IntakeFormConfig` (see `src/components/forms/types.ts`).

---

## Common conventions

Every table includes these system fields:

| Field         | Type             | Notes                                  |
| ------------- | ---------------- | -------------------------------------- |
| `Record ID`   | Autonumber / ID  | Airtable primary key                   |
| `Created At`  | Created time     | Auto-populated                         |
| `Status`      | Single select    | e.g. `New`, `In Review`, `Active`, `Archived` |
| `Source`      | Single line text | Which form / channel created the record |

Field names below use the `camelCase` keys submitted by the forms so the
later Airtable write maps 1:1. (Airtable column display names can differ; the
mapping layer will normalize.)

---

## Contacts

| Field      | Type             | Required |
| ---------- | ---------------- | -------- |
| `fullName` | Single line text | ✅       |
| `email`    | Email            | ✅       |
| `phone`    | Phone            |          |
| `subject`  | Single line text |          |
| `message`  | Long text        | ✅       |

## Youth (7–17)

| Field           | Type             | Required |
| --------------- | ---------------- | -------- |
| `firstName`     | Single line text | ✅       |
| `lastName`      | Single line text | ✅       |
| `dateOfBirth`   | Date             | ✅       |
| `age`           | Number           | ✅       |
| `gradeLevel`    | Single line text |          |
| `schoolName`    | Single line text |          |
| `guardianName`  | Single line text | ✅       |
| `guardianEmail` | Email            | ✅       |
| `guardianPhone` | Phone            | ✅       |
| `interests`     | Long text        |          |
| `consent`       | Checkbox         | ✅       |
| `Parent`        | Link → `Parents` |          |

## Parents

| Field              | Type                       | Required |
| ------------------ | -------------------------- | -------- |
| `firstName`        | Single line text           | ✅       |
| `lastName`         | Single line text           | ✅       |
| `email`            | Email                      | ✅       |
| `phone`            | Phone                      | ✅       |
| `relationship`     | Single select              | ✅       |
| `youthName`        | Single line text           |          |
| `preferredContact` | Single select              |          |
| `address`          | Long text                  |          |
| `notes`            | Long text                  |          |
| `Children`         | Link → `Youth`             |          |

## YoungAdults (18–24)

| Field              | Type             | Required |
| ------------------ | ---------------- | -------- |
| `firstName`        | Single line text | ✅       |
| `lastName`         | Single line text | ✅       |
| `dateOfBirth`      | Date             | ✅       |
| `age`              | Number           | ✅       |
| `email`            | Email            | ✅       |
| `phone`            | Phone            | ✅       |
| `employmentStatus` | Single select    |          |
| `educationLevel`   | Single select    |          |
| `goals`            | Long text        |          |
| `consent`          | Checkbox         | ✅       |

## Mentors

| Field                    | Type             | Required |
| ------------------------ | ---------------- | -------- |
| `firstName`              | Single line text | ✅       |
| `lastName`               | Single line text | ✅       |
| `email`                  | Email            | ✅       |
| `phone`                  | Phone            | ✅       |
| `occupation`             | Single line text |          |
| `areasOfExpertise`       | Long text        |          |
| `availability`           | Single select    |          |
| `experience`             | Long text        |          |
| `backgroundCheckConsent` | Checkbox         | ✅       |

## Partners

| Field              | Type             | Required |
| ------------------ | ---------------- | -------- |
| `interestType`     | Single select    | ✅       |
| `contactName`      | Single line text | ✅       |
| `organization`     | Single line text |          |
| `email`            | Email            | ✅       |
| `phone`            | Phone            |          |
| `contributionType` | Single select    |          |
| `message`          | Long text        |          |

## Donors

Mirrors `Partners` for submissions where `interestType` is `donor`. The
Donor / Partner form routes individual-giving submissions here.

| Field              | Type             | Required |
| ------------------ | ---------------- | -------- |
| `contactName`      | Single line text | ✅       |
| `organization`     | Single line text |          |
| `email`            | Email            | ✅       |
| `phone`            | Phone            |          |
| `contributionType` | Single select    |          |
| `amount`           | Currency         |          |
| `message`          | Long text        |          |

## Messages

Append-only log of every SMS (Twilio) and email notification the engine
sends or receives. Written by the `/api/twilio` and `/api/email` routes.

| Field        | Type                         | Notes                          |
| ------------ | ---------------------------- | ------------------------------ |
| `channel`    | Single select (`sms`/`email`)|                                |
| `direction`  | Single select (`outbound`/`inbound`) |                        |
| `to`         | Single line text             | Recipient phone or email       |
| `from`       | Single line text             | Sender phone or email          |
| `subject`    | Single line text             | Email only                     |
| `body`       | Long text                    | Message content                |
| `status`     | Single select                | `queued`, `sent`, `failed`     |
| `relatedTo`  | Link → any contact table     | Optional linkage to a person   |

---

## Relationships

```
Parents 1 ──< Youth          (a parent can have many youth)
Youth/YoungAdults/Mentors/Contacts ──< Messages   (a person can have many messages)
Partners / Donors            (standalone; linked to Messages when contacted)
```

These links are optional in Phase 1 and can be added in Airtable as the data
grows.
