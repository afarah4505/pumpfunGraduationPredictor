"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ScoreHistoryChartProps = {
  data: Array<{ timestamp: string; score: number }>;
};

export function ScoreHistoryChart({ data }: ScoreHistoryChartProps) {
  if (data.length === 0) {
    return <div className="flex h-48 w-full items-center justify-center rounded-lg border border-border/70 text-xs sm:text-sm text-muted sm:h-64">Real score history is unavailable for this token.</div>;
  }

  return (
    <div className="h-48 w-full overflow-x-auto sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
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