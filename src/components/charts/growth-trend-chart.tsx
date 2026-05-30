"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type GrowthTrendChartProps = {
  data: Array<{ day: string; holders: number; volume: number }>;
};

export function GrowthTrendChart({ data }: GrowthTrendChartProps) {
  if (data.length === 0) {
    return <div className="flex h-56 w-full items-center justify-center rounded-lg border border-border/70 text-xs sm:text-sm text-muted sm:h-72">Real growth trend data is unavailable for this token.</div>;
  }

  return (
    <div className="h-56 w-full overflow-x-auto sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="day" stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
          <YAxis stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--chart-tooltip-bg)",
              border: "1px solid var(--chart-tooltip-border)",
              borderRadius: 10,
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Legend />
          <Bar dataKey="holders" fill="#00d084" radius={[6, 6, 0, 0]} />
          <Bar dataKey="volume" fill="#4e9aff" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}