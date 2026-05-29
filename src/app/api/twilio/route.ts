import { NextResponse } from "next/server";
import { isTwilioConfigured } from "@/lib/env";

interface TwilioPayload {
  to?: string;
  body?: string;
}

/**
 * PLACEHOLDER — Twilio SMS dispatch.
 *
 * Phase 1 validates the payload and reports whether Twilio is configured.
 * It does NOT send a real SMS yet. The actual Twilio client call (using
 * TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER) lands in a
 * later phase.
 */
export async function POST(request: Request) {
  let payload: TwilioPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { to, body } = payload;

  if (!to || !body) {
    return NextResponse.json(
      { ok: false, error: '"to" and "body" are required.' },
      { status: 400 },
    );
  }

  if (!isTwilioConfigured()) {
    return NextResponse.json(
      {
        ok: true,
        sent: false,
        message:
          "Twilio not configured — message validated but not sent. Set " +
          "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
      },
      { status: 202 },
    );
  }

  // TODO (later phase): send via the Twilio REST API / SDK.

  return NextResponse.json({
    ok: true,
    sent: false,
    message: "Twilio send not yet implemented (Phase 1 placeholder).",
  });
}
