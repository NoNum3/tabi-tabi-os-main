import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { recaptchaToken } = await req.json();
  if (!recaptchaToken) {
    return NextResponse.json({ success: false, error: "No token provided" }, { status: 400 });
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ success: false, error: "Server misconfiguration: missing secret key" }, { status: 500 });
  }

  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${recaptchaToken}`,
    { method: "POST" }
  );
  const data = await response.json();

  if (data.success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ success: false, error: data["error-codes"] }, { status: 400 });
  }
} 