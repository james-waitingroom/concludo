"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Row = { id: string; name: string; customer: string; transaction_price: number | null; status: string };

const money = (n: number | null) => (n == null ? "—" : "$" + Number(n).toLocaleString("en-US"));
const STATUS: { key: string; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "in_review", label: "In Review" },
  { key: "denied", label: "Denied" },
];
const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUS.map((s) => [s.key, s.label]));

export default function ContractsTable({ contracts }: { contracts: Row[] }) {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [minTcv, setMinTcv] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPanelOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const allCustomers = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.customer))).sort((a, b) => a.localeCompare(b)),
    [contracts],
  );

  const toggle = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  const min = minTcv.trim() === "" ? null : Number(minTcv);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contracts.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (customers.size && !customers.has(c.customer)) return false;
      if (statuses.size && !statuses.has(c.status)) return false;
      if (min != null && !Number.isNaN(min) && Number(c.transaction_price ?? 0) < min) return false;
      return true;
    });
  }, [contracts, query, customers, statuses, min]);

  const activeCount = customers.size + statuses.size + (min != null && !Number.isNaN(min) ? 1 : 0);
  const clearAll = () => { setCustomers(new Set()); setStatuses(new Set()); setMinTcv(""); };

  return (
    <>
      <div className="toolbar">
        <div className="searchbox">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input placeholder="Search by contract name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="filterwrap" ref={wrapRef}>
          <button type="button" className="filterbtn" onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
            Filters
            {activeCount > 0 ? <span className="fcount">{activeCount}</span> : null}
          </button>
          {panelOpen && (
            <div className="filterpanel">
              <div className="fgroup">
                <div className="flabel">Status</div>
                {STATUS.map((s) => (
                  <label className="checkline" key={s.key}>
                    <input type="checkbox" checked={statuses.has(s.key)} onChange={() => toggle(statuses, s.key, setStatuses)} />
                    <span className={`pill ${s.key}`}><span className="d"></span>{s.label}</span>
                  </label>
                ))}
              </div>
              <div className="fgroup">
                <div className="flabel">Total contract value over</div>
                <div className="numrow">
                  <span className="mono">$</span>
                  <input type="number" min={0} step={1000} placeholder="0" value={minTcv} onChange={(e) => setMinTcv(e.target.value)} />
                </div>
              </div>
              <div className="fgroup">
                <div className="flabel">Customer</div>
                <div className="checkscroll">
                  {allCustomers.map((cust) => (
                    <label className="checkline" key={cust}>
                      <input type="checkbox" checked={customers.has(cust)} onChange={() => toggle(customers, cust, setCustomers)} />
                      {cust}
                    </label>
                  ))}
                </div>
              </div>
              <div className="panelfoot">
                <button type="button" className="clearlink" onClick={clearAll}>Clear all</button>
                <span className="resultcount">{filtered.length} of {contracts.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Contract Name</th>
                <th>Customer</th>
                <th className="r">Total Contract Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr className="row" key={c.id}>
                  <td>
                    <Link href={`/contracts/${c.id}`} style={{ display: "block" }}>
                      <span className="name">{c.name}</span>
                      <span className="cid">{String(c.id).slice(0, 8)}</span>
                    </Link>
                  </td>
                  <td><Link href={`/contracts/${c.id}`} style={{ display: "block" }}>{c.customer}</Link></td>
                  <td className="r mono"><Link href={`/contracts/${c.id}`} style={{ display: "block" }}>{money(c.transaction_price)}</Link></td>
                  <td>
                    <Link href={`/contracts/${c.id}`} style={{ display: "block" }}>
                      <span className={`pill ${c.status}`}><span className="d"></span>{STATUS_LABEL[c.status] ?? c.status}</span>
                    </Link>
                  </td>
                  <td className="r"><Link href={`/contracts/${c.id}`}><span className="chev">›</span></Link></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ color: "var(--muted)", textAlign: "center", padding: "28px" }}>No contracts match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
