import type { ChannelStatus, Salon } from "@/lib/domain";

import { DesktopSidebar } from "./desktop-sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  attentionCount: number;
  channels: ChannelStatus[];
  children: React.ReactNode;
  salon: Salon;
}

export function AppShell({
  attentionCount,
  channels,
  children,
  salon,
}: AppShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <DesktopSidebar attentionCount={attentionCount} />

      <div className="min-w-0">
        <TopBar
          attentionCount={attentionCount}
          channels={channels}
          salon={salon}
        />
        <main
          className="mx-auto w-full max-w-[100rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9"
          id="contenuto-principale"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
