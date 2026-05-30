"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ScoreHistoryChartProps = {
  data: Array<{ timestamp: string; score: number }>;
};

export function ScoreHistoryChart({ data }: ScoreHistoryChartProps) {
  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center rounded-lg border border-border/70 text-sm text-muted">Real score history is unavailable for this token.</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="timestamp" stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
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
          <Line
            type="monotone"
            dataKey="score"
            stroke="#00d084"
            strokeWidth={3}
            dot={{ fill: "#00d084", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}