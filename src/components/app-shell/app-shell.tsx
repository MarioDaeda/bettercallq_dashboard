import type { AppIdentity } from "@/lib/auth/identity";
import type { AppRole } from "@/lib/auth/permissions";
import type { ChannelStatus, Salon } from "@/lib/domain";

import { DesktopSidebar } from "./desktop-sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  attentionCount: number;
  channels: ChannelStatus[];
  children: React.ReactNode;
  role: AppRole;
  salon: Salon;
  user: AppIdentity;
}

export function AppShell({
  attentionCount,
  channels,
  children,
  role,
  salon,
  user,
}: AppShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <DesktopSidebar attentionCount={attentionCount} role={role} />

      <div className="min-w-0">
        <TopBar
          attentionCount={attentionCount}
          channels={channels}
          role={role}
          salon={salon}
          user={user}
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
