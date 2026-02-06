// app/api/auth/me/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  return NextResponse.json({
    authenticated: Boolean(token),
  });
}
