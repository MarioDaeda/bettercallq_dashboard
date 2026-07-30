import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BetterCallQ Dashboard",
  description:
    "Pannello privato per configurare e monitorare la receptionist IA BetterCallQ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full">
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
