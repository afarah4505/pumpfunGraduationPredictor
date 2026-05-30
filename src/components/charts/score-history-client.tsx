"use client";

import { useEffect, useMemo, useState } from "react";
import { ScoreHistoryChart } from "@/components/charts/score-history-chart";
import { appendScoreSnapshot, getScoreSnapshots, toScoreHistoryChartData } from "@/lib/score-history-client";

type ScoreHistoryClientProps = {
  address: string;
  score: number | null;
};

export function ScoreHistoryClient({ address, score }: ScoreHistoryClientProps) {
  const [chartData, setChartData] = useState<Array<{ timestamp: string; score: number }>>([]);

  useEffect(() => {
    appendScoreSnapshot(address, score);
    const snapshots = getScoreSnapshots(address);
    setChartData(toScoreHistoryChartData(snapshots));
  }, [address, score]);

  const data = useMemo(() => chartData, [chartData]);

  return <ScoreHistoryChart data={data} />;
}
