import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import ContractsTable from "./ContractsTable";

export const dynamic = "force-dynamic"; // always read fresh from the DB

export default async function ContractsPage() {
  const db = supabaseServer();
  const { data, error } = await db
    .from("contracts")
    .select("id,name,customer,transaction_price,status")
    .order("name");

  return (
    <div className="content wide">
      <div className="list-head">
        <div>
          <div className="eyebrow">Revenue · Contracts</div>
          <h1>Contracts</h1>
          <div className="sub">{data?.length ?? 0} contracts in your workspace.</div>
        </div>
        <Link href="/contracts/new" className="addbtn"><span className="plus">+</span> Add contract</Link>
      </div>

      {error ? (
        <div className="empty-note" style={{ marginTop: 24 }}>Couldn&apos;t load contracts: {error.message}</div>
      ) : (
        <ContractsTable contracts={data ?? []} />
      )}
    </div>
  );
}
