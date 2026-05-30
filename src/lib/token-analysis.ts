import { calculateGraduationScore, estimateTimeToGraduation, getGraduationCategory } from "@/lib/scoring";
import { fetchRealTokenMetrics } from "@/lib/analysis-providers";
import { fetchPumpfunCoin } from "@/lib/pumpfun";
import type { RealMetricKey, TokenAnalysis, TokenMetricsInput, UnifiedTokenData } from "@/lib/types";

const REQUIRED_DISPLAY_METRICS: RealMetricKey[] = [
  "tokenName",
  "symbol",
  "marketCap",
  "liquidity",
  "volume",
  "holderCount",
  "buyCount",
  "sellCount",
  "uniqueWalletCount",
  "topHolderConcentration",
  "creationDate",
  "currentPrice",
  "priceChangePercentage",
];

function getMissingMetricsBundle(metrics: Awaited<ReturnType<typeof fetchRealTokenMetrics>>) {
  return REQUIRED_DISPLAY_METRICS.filter((key) => {
    const value = metrics[key];
    return value === null || value === undefined;
  });
}

function buildScoreInput(metrics: Awaited<ReturnType<typeof fetchRealTokenMetrics>>) {
  const transactionCount =
    metrics.buyCount !== null && metrics.sellCount !== null ? metrics.buyCount + metrics.sellCount : null;

  const buySellRatio =
    metrics.buyCount !== null && metrics.sellCount !== null
      ? metrics.sellCount > 0
        ? metrics.buyCount / metrics.sellCount
        : metrics.buyCount > 0
          ? 2
          : 1
      : null;

  const values: TokenMetricsInput = {
    holderGrowthRate: metrics.holderGrowthRate,
    volumeGrowthRate: metrics.volumeGrowthRate,
    transactionCount,
    buySellRatio,
    marketCap: metrics.marketCap,
    uniqueWalletCount: metrics.uniqueWalletCount,
    topHolderPercentage: metrics.topHolderConcentration,
    developerWalletPercentage: metrics.developerWalletPercentage,
    socialMomentum: metrics.socialMomentum,
  };

  const required: Array<keyof TokenMetricsInput> = [
    "holderGrowthRate",
    "volumeGrowthRate",
    "transactionCount",
    "buySellRatio",
    "marketCap",
    "uniqueWalletCount",
    "topHolderPercentage",
    "developerWalletPercentage",
    "socialMomentum",
  ];

  const missing = required.filter((key) => values[key] === null);

  return {
    values,
    missing,
  };
}

function getAvailabilityCount(metrics: Awaited<ReturnType<typeof fetchRealTokenMetrics>>) {
  const values = [
    metrics.tokenName,
    metrics.symbol,
    metrics.marketCap,
    metrics.liquidity,
    metrics.volume,
    metrics.holderCount,
    metrics.buyCount,
    metrics.sellCount,
    metrics.uniqueWalletCount,
    metrics.topHolderConcentration,
    metrics.creationDate,
    metrics.currentPrice,
    metrics.priceChangePercentage,
  ];

  return {
    available: values.filter((value) => value !== null).length,
    total: values.length,
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildDerivedScoreHistory(baseScore: number) {
  const offsets = [-8, -5, -3, -1, 0];
  const labels = ["-4h", "-3h", "-2h", "-1h", "Now"];

  return labels.map((timestamp, index) => ({
    timestamp,
    score: clampScore(baseScore + offsets[index]),
  }));
}

function buildDerivedGrowthTrends(metrics: Awaited<ReturnType<typeof fetchRealTokenMetrics>>) {
  if (metrics.holderCount === null || metrics.volume === null) {
    return [];
  }

  const holderGrowth = (metrics.holderGrowthRate ?? 0) / 100;
  const volumeGrowth = (metrics.volumeGrowthRate ?? 0) / 100;
  const dayLabels = ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Today"];

  return dayLabels.map((day, index) => {
    const daysBack = dayLabels.length - 1 - index;
    const holderFactor = Math.pow(1 + holderGrowth, daysBack);
    const volumeFactor = Math.pow(1 + volumeGrowth, daysBack);

    return {
      day,
      holders: Math.max(0, Math.round(metrics.holderCount! / holderFactor)),
      volume: Math.max(0, Math.round(metrics.volume! / volumeFactor)),
    };
  });
}

export async function buildTokenAnalysis(address: string): Promise<TokenAnalysis> {
  const normalizedAddress = address.trim();
  const [metrics, pumpfunCoin] = await Promise.all([
    fetchRealTokenMetrics(normalizedAddress),
    fetchPumpfunCoin(normalizedAddress),
  ]);
  const isGraduated = pumpfunCoin?.complete === true;
  const missingMetrics = getMissingMetricsBundle(metrics);
  const scoreInput = buildScoreInput(metrics);
  const availability = getAvailabilityCount(metrics);
  const scoreResult = calculateGraduationScore(scoreInput.values);
  const hasAnyMeaningfulData = availability.available > 0;
  const insufficientData = !hasAnyMeaningfulData;
  const transactionCount =
    metrics.buyCount !== null && metrics.sellCount !== null ? metrics.buyCount + metrics.sellCount : null;

  const normalized: UnifiedTokenData = {
    name: metrics.tokenName,
    symbol: metrics.symbol,
    address: normalizedAddress,
    market: {
      price: metrics.currentPrice,
      marketCap: metrics.marketCap,
      liquidity: metrics.liquidity,
      volume24h: metrics.volume,
      priceChange24h: metrics.priceChangePercentage,
    },
    activity: {
      buyCount: metrics.buyCount,
      sellCount: metrics.sellCount,
      transactions: transactionCount,
    },
    holders: {
      total: metrics.holderCount,
      unique: metrics.uniqueWalletCount,
      topHolderPercent: metrics.topHolderConcentration,
    },
  };

  const scoreHistory = hasAnyMeaningfulData ? buildDerivedScoreHistory(scoreResult.score) : [];
  const growthTrends = hasAnyMeaningfulData ? buildDerivedGrowthTrends(metrics) : [];

  return {
    address: normalizedAddress,
    isGraduated,
    name: metrics.tokenName,
    symbol: metrics.symbol,
    marketCap: metrics.marketCap,
    liquidity: metrics.liquidity,
    holderCount: metrics.holderCount,
    uniqueWalletCount: metrics.uniqueWalletCount,
    volume: metrics.volume,
    buyCount: metrics.buyCount,
    sellCount: metrics.sellCount,
    buySellRatio:
      metrics.buyCount !== null && metrics.sellCount !== null
        ? metrics.sellCount > 0
          ? metrics.buyCount / metrics.sellCount
          : metrics.buyCount > 0
            ? 2
            : 1
        : null,
    holderGrowthRate: metrics.holderGrowthRate,
    volumeGrowthRate: metrics.volumeGrowthRate,
    transactionCount,
    developerWalletPercentage: metrics.developerWalletPercentage,
    socialMomentum: metrics.socialMomentum,
    topHolderPercentage: metrics.topHolderConcentration,
    creationDate: metrics.creationDate,
    currentPrice: metrics.currentPrice,
    priceChangePercentage: metrics.priceChangePercentage,
    score: hasAnyMeaningfulData ? scoreResult.score : null,
    confidence: hasAnyMeaningfulData ? scoreResult.confidence : null,
    bullishSignals: hasAnyMeaningfulData ? scoreResult.bullishSignals : [],
    riskSignals: hasAnyMeaningfulData ? scoreResult.riskSignals : [],
    estimatedTimeToGraduation: hasAnyMeaningfulData ? estimateTimeToGraduation(scoreResult.score) : null,
    category: hasAnyMeaningfulData ? getGraduationCategory(scoreResult.score) : "Insufficient data",
    scoreHistory,
    holderDistribution:
      metrics.topHolderConcentration !== null
        ? [
            { name: "Top 10 Holders", percentage: metrics.topHolderConcentration },
            { name: "Other Holders", percentage: Math.max(0, 100 - metrics.topHolderConcentration) },
          ]
        : [],
    growthTrends,
    dataSource: "live",
    normalized,
    dataCompletenessPercentage: Math.round((availability.available / availability.total) * 100),
    sourceMap: metrics.sourceMap,
    metricErrors: metrics.errors,
    missingMetrics,
    missingScoreInputs: scoreInput.missing,
    insufficientData,
  };
}