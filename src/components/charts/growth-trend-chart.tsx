"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type GrowthTrendChartProps = {
  data: Array<{ day: string; holders: number; volume: number }>;
};

export function GrowthTrendChart({ data }: GrowthTrendChartProps) {
  if (data.length === 0) {
    return <div className="flex h-72 items-center justify-center rounded-lg border border-border/70 text-sm text-muted">Real growth trend data is unavailable for this token.</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
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