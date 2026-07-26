import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/** OAuth (Google) and email-confirmation callback: exchange the code for a session, then continue. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/contracts", url.origin));
}
