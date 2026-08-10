import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set("kopert_demo_session", "demo@kopert.app", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
