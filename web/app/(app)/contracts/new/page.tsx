import Link from "next/link";
import NewContractForm from "./NewContractForm";

export const dynamic = "force-dynamic";

export default function NewContractPage() {
  return (
    <div className="content" style={{ maxWidth: 640 }}>
      <div className="crumb"><Link href="/contracts">Contracts</Link> / Add contract</div>
      <h1>Add a contract</h1>
      <div className="sub">Upload the source PDF and a couple of details. It&apos;s stored privately and added to your workspace.</div>
      <NewContractForm />
    </div>
  );
}
