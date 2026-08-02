import { AppShell } from "@/components/app-shell/app-shell";
import { InterventionSessionProvider } from "@/components/interventions/intervention-session-context";
import { requireAppSession } from "@/lib/auth/session";
import {
  dashboardService,
  PILOT_SALON_ID,
} from "@/lib/services/mock-dashboard-service";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAppSession();
  const salonId = session.salonId ?? PILOT_SALON_ID;

  const [salon, channels, interventions] = await Promise.all([
    dashboardService.getSalon(salonId),
    dashboardService.getChannelStatuses(salonId),
    dashboardService.listInterventions(salonId, {
      statuses: ["open", "in_progress"],
    }),
  ]);

  return (
    <>
      <a
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        href="#contenuto-principale"
      >
        Vai al contenuto
      </a>
      <InterventionSessionProvider initialInterventions={interventions}>
        <AppShell
          attentionCount={interventions.length}
          channels={channels}
          role={session.role}
          salon={salon}
          user={session}
        >
          {children}
        </AppShell>
      </InterventionSessionProvider>
    </>
  );
}
