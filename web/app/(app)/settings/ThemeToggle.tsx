"use client";

import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";

const SUN = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
const MOON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>;
const MON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>;

const OPTIONS: { mode: Mode; label: string; icon: React.ReactNode }[] = [
  { mode: "system", label: "System", icon: MON },
  { mode: "light", label: "Light", icon: SUN },
  { mode: "dark", label: "Dark", icon: MOON },
];

function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") { root.removeAttribute("data-theme"); localStorage.setItem("concludo-theme", "system"); }
  else { root.setAttribute("data-theme", mode); localStorage.setItem("concludo-theme", mode); }
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("concludo-theme") as Mode) || "system";
    setMode(stored);
  }, []);

  function choose(m: Mode) { setMode(m); apply(m); }

  return (
    <div className="themerow">
      {OPTIONS.map((o) => (
        <button key={o.mode} type="button" className={`themebtn${mode === o.mode ? " on" : ""}`} onClick={() => choose(o.mode)}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
