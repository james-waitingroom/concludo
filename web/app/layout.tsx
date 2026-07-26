import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Concludo — Revenue Recognition Workspace",
  description: "ASC 606 & ASC 340-40 judgment engine, backed by Supabase.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
