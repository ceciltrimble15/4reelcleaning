import { NextResponse } from "next/server";
import { isEmailConfigured } from "@/lib/env";

interface EmailPayload {
  to?: string;
  subject?: string;
  body?: string;
}

/**
 * PLACEHOLDER — Email notification dispatch.
 *
 * Phase 1 validates the payload and reports whether an email provider is
 * configured. It does NOT send a real email yet. The provider integration
 * (using EMAIL_PROVIDER / EMAIL_FROM) is implemented in a later phase.
 */
export async function POST(request: Request) {
  let payload: EmailPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { to, subject, body } = payload;

  if (!to || !subject || !body) {
    return NextResponse.json(
      { ok: false, error: '"to", "subject", and "body" are required.' },
      { status: 400 },
    );
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        ok: true,
        sent: false,
        message:
          "Email not configured — message validated but not sent. Set " +
          "EMAIL_PROVIDER and EMAIL_FROM.",
      },
      { status: 202 },
    );
  }

  // TODO (later phase): send via the configured email provider.

  return NextResponse.json({
    ok: true,
    sent: false,
    message: "Email send not yet implemented (Phase 1 placeholder).",
  });
}
