import { NextResponse } from "next/server";

// Placeholder Twilio (SMS) integration.
//
// Phase 1 validates the request and returns a fake message SID. When
// credentials are provided (see .env.example), replace the handler body with a
// real call to the Twilio Messages API:
//   POST https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages.json
//   Auth: Basic base64(TWILIO_ACCOUNT_SID:TWILIO_AUTH_TOKEN)
//   Body: To, From (TWILIO_FROM_NUMBER), Body

interface TwilioRequest {
  to?: string;
  message?: string;
}

export async function POST(request: Request) {
  let body: TwilioRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.message || typeof body.message !== "string") {
    return NextResponse.json(
      { error: "Missing required field: message." },
      { status: 400 },
    );
  }

  const configured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );

  // TODO(Phase 2): send the real SMS when `configured` is true.
  return NextResponse.json({
    ok: true,
    placeholder: true,
    configured,
    to: body.to ?? null,
    messageSid: `SM_placeholder_${Date.now()}`,
  });
}
