import { NextResponse } from "next/server";
import { isAirtableConfigured } from "@/lib/env";

// Tables defined in the Airtable architecture. See docs/airtable-schema.md.
const VALID_TABLES = [
  "Contacts",
  "Youth",
  "Parents",
  "YoungAdults",
  "Mentors",
  "Partners",
  "Donors",
  "Messages",
] as const;

type ValidTable = (typeof VALID_TABLES)[number];

interface AirtablePayload {
  table?: string;
  fields?: Record<string, unknown>;
}

/**
 * PLACEHOLDER — Airtable record creation.
 *
 * In Phase 1 this route validates the payload and confirms whether the
 * Airtable integration is configured. It does NOT perform a real Airtable
 * write yet. Wiring the actual API call (using AIRTABLE_API_KEY /
 * AIRTABLE_BASE_ID) is a later phase.
 */
export async function POST(request: Request) {
  let payload: AirtablePayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { table, fields } = payload;

  if (!table || !VALID_TABLES.includes(table as ValidTable)) {
    return NextResponse.json(
      {
        ok: false,
        error: `"table" must be one of: ${VALID_TABLES.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    return NextResponse.json(
      { ok: false, error: '"fields" must be an object.' },
      { status: 400 },
    );
  }

  if (!isAirtableConfigured()) {
    // Accept the submission so the UI flow works during development, but make
    // it clear no record was actually written.
    return NextResponse.json(
      {
        ok: true,
        persisted: false,
        message:
          "Airtable not configured — payload validated but not written. " +
          "Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID to enable writes.",
        table,
      },
      { status: 202 },
    );
  }

  // TODO (later phase): create the record via the Airtable REST API.
  // const res = await fetch(`https://api.airtable.com/v0/${baseId}/${table}`, ...)

  return NextResponse.json({
    ok: true,
    persisted: false,
    message: "Airtable write not yet implemented (Phase 1 placeholder).",
    table,
  });
}
