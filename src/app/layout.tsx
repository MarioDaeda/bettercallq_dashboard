import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/app-shell/app-shell";
import { ThemeBootScript } from "@/components/app-shell/theme-boot-script";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [salon, channels, interventions] = await Promise.all([
    dashboardService.getSalon(PILOT_SALON_ID),
    dashboardService.getChannelStatuses(PILOT_SALON_ID),
    dashboardService.listInterventions(PILOT_SALON_ID, {
      statuses: ["open", "in_progress"],
    }),
  ]);

  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <ThemeBootScript />
      </head>
      <body>
        <a
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          href="#contenuto-principale"
        >
          Vai al contenuto
        </a>
        <AppShell
          attentionCount={interventions.length}
          channels={channels}
          salon={salon}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
