"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailyMetric } from "@/lib/domain";
import { formatUsdMicros } from "@/lib/overview/formatters";

interface MonitoringTrendChartProps {
  metrics: DailyMetric[];
}

const shortDate = (value: string) =>
  new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00.000Z`));

export function MonitoringTrendChart({
  metrics,
}: MonitoringTrendChartProps) {
  const data = metrics.map((metric) => ({
    calls: metric.callsReceived,
    costUsdMicros: metric.costTotalUsdMicros,
    date: metric.date,
    label: shortDate(metric.date),
    whatsapp: metric.whatsappConversations,
  }));

  return (
    <div
      aria-label="Grafico giornaliero di chiamate, conversazioni WhatsApp e costo reale Vapi in USD"
      className="h-72 w-full min-w-0"
      role="img"
    >
      <ResponsiveContainer height="100%" width="100%">
        <ComposedChart
          accessibilityLayer
          data={data}
          margin={{ bottom: 0, left: -24, right: 0, top: 12 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey="label"
            minTickGap={12}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            yAxisId="volume"
          />
          <YAxis
            axisLine={false}
            orientation="right"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(value) =>
              formatUsdMicros(Number(value))
            }
            tickLine={false}
            width={74}
            yAxisId="cost"
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--popover-foreground)",
              fontSize: "12px",
            }}
            cursor={{ fill: "var(--muted)" }}
            formatter={(value, name) =>
              name === "Costo Vapi"
                ? [formatUsdMicros(Number(value)), name]
                : [value, name]
            }
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.date
                ? shortDate(payload[0].payload.date)
                : ""
            }
          />
          <Bar
            dataKey="calls"
            fill="var(--chart-1)"
            isAnimationActive={false}
            name="Chiamate"
            radius={[6, 6, 0, 0]}
            yAxisId="volume"
          />
          <Bar
            dataKey="whatsapp"
            fill="var(--chart-2)"
            isAnimationActive={false}
            name="WhatsApp"
            radius={[6, 6, 0, 0]}
            yAxisId="volume"
          />
          <Line
            dataKey="costUsdMicros"
            dot={{ fill: "var(--card)", r: 3.5, strokeWidth: 2 }}
            isAnimationActive={false}
            name="Costo Vapi"
            stroke="var(--chart-3)"
            strokeWidth={2.5}
            type="monotone"
            yAxisId="cost"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
