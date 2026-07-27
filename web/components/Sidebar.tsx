"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/login/actions";

type Item = { label: string; href: string; soon?: boolean };
type Group = { key: string; label: string; icon: React.ReactNode; items: Item[] };

const ic = (path: React.ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);

const NAV: Group[] = [
  {
    key: "home",
    label: "Home",
    icon: ic(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>),
    items: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    key: "revenue",
    label: "Revenue",
    icon: ic(<><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 4-5" /></>),
    items: [
      { label: "Overview", href: "/revenue" },
      { label: "Contracts", href: "/contracts" },
      { label: "Policies", href: "/policies" },
    ],
  },
  {
    key: "equity",
    label: "Equity",
    icon: ic(<><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /></>),
    items: [{ label: "Overview", href: "/equity", soon: true }],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({ userEmail, isAdmin, companyName }: { userEmail: string; isAdmin: boolean; companyName: string }) {
  const initial = (companyName || userEmail || "?").trim().charAt(0).toUpperCase();
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of NAV) init[g.key] = g.items.some((i) => isActive(pathname, i.href));
    // default the Revenue group open on first load if nothing else matches
    if (!Object.values(init).some(Boolean)) init.revenue = true;
    return init;
  });

  return (
    <aside className="side">
      <div className="brand"><span className="glyph">C</span> Concludo</div>

      <nav className="nav">
        {NAV.map((g) => {
          const groupActive = g.items.some((i) => isActive(pathname, i.href));
          const expanded = open[g.key];
          return (
            <div className="navgroup" key={g.key}>
              <button
                type="button"
                className={`navhead${groupActive ? " on" : ""}`}
                onClick={() => setOpen((s) => ({ ...s, [g.key]: !s[g.key] }))}
                aria-expanded={expanded}
              >
                <span className="navicon">{g.icon}</span>
                <span className="navtext">{g.label}</span>
                <span className={`caret${expanded ? " up" : ""}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </span>
              </button>
              {expanded && (
                <div className="navsub">
                  {g.items.map((i) => (
                    <Link key={i.href} href={i.href} className={`navitem${isActive(pathname, i.href) ? " active" : ""}`}>
                      {i.label}
                      {i.soon ? <span className="soon">soon</span> : null}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidefoot">
        <Link href="/settings" className={`footlink${isActive(pathname, "/settings") ? " active" : ""}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          Settings
        </Link>
        {isAdmin ? (
          <a href="/admin" className="footlink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /></svg>
            Admin console
          </a>
        ) : null}
        <div className="acct">
          <Link href="/settings" className="avatar" title="Set company icon" aria-label="Set company icon">
            {initial}
            <span className="cam">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M4 8h3l2-2h6l2 2h3v11H4z" /><circle cx="12" cy="13" r="3" /></svg>
            </span>
          </Link>
          <div className="acctbody">
            <div className="acctmail" title={userEmail}>{userEmail}</div>
            <form action={signOutAction}><button className="signout" type="submit">Sign out</button></form>
          </div>
        </div>
      </div>
    </aside>
  );
}
