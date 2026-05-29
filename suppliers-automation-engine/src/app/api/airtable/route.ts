import { NextResponse } from "next/server";

// Placeholder Airtable integration.
//
// Phase 1 only validates the request shape and echoes back a fake record id.
// When credentials are provided (see .env.example) and business logic is added,
// replace the body of this handler with a real call to the Airtable REST API:
//   POST https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{table}
//   Authorization: Bearer {AIRTABLE_API_KEY}

interface AirtableRequest {
  table?: string;
  fields?: Record<string, unknown>;
}

export async function POST(request: Request) {
  let body: AirtableRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.table || typeof body.table !== "string") {
    return NextResponse.json(
      { error: "Missing required field: table." },
      { status: 400 },
    );
  }
  if (!body.fields || typeof body.fields !== "object") {
    return NextResponse.json(
      { error: "Missing required field: fields." },
      { status: 400 },
    );
  }

  const configured = Boolean(
    process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID,
  );

  // TODO(Phase 2): perform the real Airtable create when `configured` is true.
  return NextResponse.json({
    ok: true,
    placeholder: true,
    configured,
    table: body.table,
    recordId: `rec_placeholder_${Date.now()}`,
    received: body.fields,
  });
}
