import type { Metadata, Viewport } from "next";

import { ThemeBootScript } from "@/components/app-shell/theme-boot-script";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BetterCallQ",
    template: "%s · BetterCallQ",
  },
  description:
    "Pannello privato per configurare e monitorare la receptionist IA BetterCallQ.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6fc" },
    { media: "(prefers-color-scheme: dark)", color: "#17151f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <ThemeBootScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
