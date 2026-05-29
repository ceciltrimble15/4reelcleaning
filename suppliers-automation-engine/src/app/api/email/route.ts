import { NextResponse } from "next/server";

// Placeholder transactional email integration.
//
// Phase 1 validates the request and returns a fake message id. When an email
// provider is configured (see .env.example — e.g. an SMTP server or a provider
// API key), replace the handler body with the real send call.

interface EmailRequest {
  to?: string;
  subject?: string;
  body?: string;
}

export async function POST(request: Request) {
  let payload: EmailRequest;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.to || typeof payload.to !== "string") {
    return NextResponse.json(
      { error: "Missing required field: to." },
      { status: 400 },
    );
  }
  if (!payload.subject || typeof payload.subject !== "string") {
    return NextResponse.json(
      { error: "Missing required field: subject." },
      { status: 400 },
    );
  }

  const configured = Boolean(
    process.env.EMAIL_API_KEY && process.env.EMAIL_FROM_ADDRESS,
  );

  // TODO(Phase 2): send the real email when `configured` is true.
  return NextResponse.json({
    ok: true,
    placeholder: true,
    configured,
    to: payload.to,
    messageId: `email_placeholder_${Date.now()}`,
  });
}
