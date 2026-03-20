import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manychat-lite v1",
  description: "Local Instagram automation tool"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
