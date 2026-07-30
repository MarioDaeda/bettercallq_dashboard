"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailyMetric } from "@/lib/domain";

interface UsageChartProps {
  metrics: DailyMetric[];
}

const shortDate = (value: string) =>
  new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00.000Z`));

export function UsageChart({ metrics }: UsageChartProps) {
  const data = metrics.map((metric) => ({
    bookings: metric.bookingsAttributed,
    calls: metric.callsReceived,
    date: metric.date,
    label: shortDate(metric.date),
  }));

  return (
    <div
      aria-label="Grafico di chiamate ricevute e prenotazioni attribuite nel periodo"
      className="h-64 w-full min-w-0 sm:h-72"
      role="img"
    >
      <ResponsiveContainer height="100%" width="100%">
        <ComposedChart
          accessibilityLayer
          data={data}
          margin={{ bottom: 0, left: -24, right: 4, top: 10 }}
        >
          <defs>
            <linearGradient id="calls-fill" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--chart-1)"
                stopOpacity={0.28}
              />
              <stop
                offset="100%"
                stopColor="var(--chart-1)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
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
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--popover-foreground)",
              fontSize: "12px",
            }}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.date
                ? shortDate(payload[0].payload.date)
                : ""
            }
          />
          <Area
            dataKey="calls"
            dot={{ fill: "var(--card)", r: 3.5, strokeWidth: 2 }}
            fill="url(#calls-fill)"
            isAnimationActive={false}
            name="Chiamate"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            type="monotone"
          />
          <Line
            dataKey="bookings"
            dot={{ fill: "var(--card)", r: 3.5, strokeWidth: 2 }}
            isAnimationActive={false}
            name="Prenotazioni"
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
