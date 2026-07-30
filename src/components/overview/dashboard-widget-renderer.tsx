import { cn } from "@/lib/utils";

import {
  ChannelStatusCard,
  type ChannelStatusCardProps,
} from "./channel-status-card";
import {
  IntegrationErrorCard,
  type IntegrationErrorCardProps,
} from "./integration-error-card";
import {
  InterventionQueue,
  type InterventionQueueProps,
} from "./intervention-queue";
import { KpiCard, type KpiCardProps } from "./kpi-card";
import {
  RecentActivityCard,
  type RecentActivityCardProps,
} from "./recent-activity-card";
import {
  UsageTrendCard,
  type UsageTrendCardProps,
} from "./usage-trend-card";

type WidgetLayout =
  | "kpi"
  | "channels"
  | "queue"
  | "trend"
  | "errors"
  | "activity";

interface WidgetBase {
  id: string;
  layout: WidgetLayout;
}

export type DashboardWidget =
  | (WidgetBase & { kind: "kpi"; props: KpiCardProps })
  | (WidgetBase & {
      kind: "channels";
      props: ChannelStatusCardProps;
    })
  | (WidgetBase & {
      kind: "queue";
      props: InterventionQueueProps;
    })
  | (WidgetBase & {
      kind: "trend";
      props: UsageTrendCardProps;
    })
  | (WidgetBase & {
      kind: "errors";
      props: IntegrationErrorCardProps;
    })
  | (WidgetBase & {
      kind: "activity";
      props: RecentActivityCardProps;
    });

const layoutClasses: Record<WidgetLayout, string> = {
  kpi: "md:col-span-1 xl:col-span-3",
  channels: "md:col-span-2 xl:col-span-5",
  queue: "md:col-span-2 xl:col-span-7",
  trend: "md:col-span-2 xl:col-span-8",
  errors: "md:col-span-2 xl:col-span-4",
  activity: "md:col-span-2 xl:col-span-12",
};

export function DashboardWidgetRenderer({
  widget,
}: {
  widget: DashboardWidget;
}) {
  return (
    <section
      className={cn("min-w-0", layoutClasses[widget.layout])}
      data-widget={widget.kind}
    >
      {renderWidget(widget)}
    </section>
  );
}

const renderWidget = (widget: DashboardWidget) => {
  switch (widget.kind) {
    case "kpi":
      return <KpiCard {...widget.props} />;
    case "channels":
      return <ChannelStatusCard {...widget.props} />;
    case "queue":
      return <InterventionQueue {...widget.props} />;
    case "trend":
      return <UsageTrendCard {...widget.props} />;
    case "errors":
      return <IntegrationErrorCard {...widget.props} />;
    case "activity":
      return <RecentActivityCard {...widget.props} />;
  }
};
