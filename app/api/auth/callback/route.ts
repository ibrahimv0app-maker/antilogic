import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/app";
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code) return NextResponse.redirect(new URL("/auth/sign-in?error=callback_missing_code", requestUrl.origin));
  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/auth/sign-in?error=auth_not_configured", requestUrl.origin));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/auth/sign-in?error=callback_failed", requestUrl.origin));
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
