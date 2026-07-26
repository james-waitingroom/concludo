import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const BUCKET = "contract-sources";

/** Redirect to a short-lived signed URL for the contract's stored source document (RLS-scoped). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const { data: c, error } = await db
    .from("contracts")
    .select("source_file_path,source_file_name")
    .eq("id", params.id)
    .single();

  if (error || !c?.source_file_path) {
    return NextResponse.json({ error: "No source document attached to this contract." }, { status: 404 });
  }

  const signed = await db.storage
    .from(BUCKET)
    .createSignedUrl(c.source_file_path, 120, { download: c.source_file_name ?? true });

  if (signed.error) {
    return NextResponse.json({ error: signed.error.message }, { status: 500 });
  }
  return NextResponse.redirect(signed.data.signedUrl);
}
