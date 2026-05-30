import { clamp } from "@/lib/utils";
import type { ScoreResult, TokenMetricsInput, TokenAnalysis } from "@/lib/types";

const SCORE_BASELINE = 30;

function inferConfidenceFromCompleteness(dataCompletenessPercentage: number) {
  if (dataCompletenessPercentage > 70) {
    return "High" as const;
  }

  if (dataCompletenessPercentage >= 40) {
    return "Medium" as const;
  }

  return "Low" as const;
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getGraduationCategory(score: number): TokenAnalysis["category"] {
  if (score <= 30) {
    return "Low Probability";
  }

  if (score <= 60) {
    return "Moderate Probability";
  }

  if (score <= 80) {
    return "High Probability";
  }

  return "Very High Probability";
}

export function estimateTimeToGraduation(score: number) {
  if (score >= 81) {
    return "6-18 hours";
  }

  if (score >= 61) {
    return "1-3 days";
  }

  if (score >= 31) {
    return "3-7 days";
  }

  return "Uncertain / >7 days";
}

export function calculateGraduationScore(input: TokenMetricsInput): ScoreResult {
  let score = SCORE_BASELINE;
  const bullishSignals: string[] = [];
  const riskSignals: string[] = [];
  const totalFields = 9;
  const availableFields = [
    input.holderGrowthRate,
    input.volumeGrowthRate,
    input.transactionCount,
    input.buySellRatio,
    input.marketCap,
    input.uniqueWalletCount,
    input.topHolderPercentage,
    input.developerWalletPercentage,
    input.socialMomentum,
  ].filter((value) => value !== null).length;
  const dataCompletenessPercentage = Math.round((availableFields / totalFields) * 100);

  if (isNumber(input.holderGrowthRate) && input.holderGrowthRate > 50) {
    score += 25;
    bullishSignals.push("Explosive holder growth (>50%)");
  } else if (isNumber(input.holderGrowthRate) && input.holderGrowthRate > 20) {
    score += 15;
    bullishSignals.push("Healthy holder growth (>20%)");
  } else if (isNumber(input.holderGrowthRate) && input.holderGrowthRate < 5) {
    score -= 10;
    riskSignals.push("Weak holder growth (<5%)");
  }

  if (isNumber(input.buySellRatio) && input.buySellRatio > 1.5) {
    score += 15;
    bullishSignals.push("Strong buy pressure (buy/sell > 1.5)");
  } else if (isNumber(input.buySellRatio) && input.buySellRatio < 0.9) {
    score -= 12;
    riskSignals.push("Sell pressure dominates (buy/sell < 0.9)");
  }

  if (isNumber(input.volumeGrowthRate) && input.volumeGrowthRate > 0) {
    score += 20;
    bullishSignals.push("Volume trend is positive");
  } else if (isNumber(input.volumeGrowthRate) && input.volumeGrowthRate <= 0) {
    score -= 12;
    riskSignals.push("Declining or stagnant volume trend");
  }

  if (isNumber(input.uniqueWalletCount) && input.uniqueWalletCount >= 450) {
    score += 15;
    bullishSignals.push("Strong unique wallet participation");
  } else if (isNumber(input.uniqueWalletCount) && input.uniqueWalletCount < 100) {
    score -= 8;
    riskSignals.push("Low unique wallet participation");
  }

  if (isNumber(input.transactionCount) && input.transactionCount >= 3500) {
    score += 10;
    bullishSignals.push("High transaction activity");
  } else if (isNumber(input.transactionCount) && input.transactionCount < 700) {
    score -= 8;
    riskSignals.push("Low transaction activity");
  }

  if (isNumber(input.marketCap) && input.marketCap >= 90000 && input.marketCap <= 350000) {
    score += 8;
    bullishSignals.push("Market cap range supports momentum trading");
  } else if (isNumber(input.marketCap) && input.marketCap > 700000) {
    score -= 5;
    riskSignals.push("High market cap may reduce upside speed");
  }

  if (isNumber(input.topHolderPercentage) && input.topHolderPercentage > 20) {
    score -= 20;
    riskSignals.push("Top holder concentration above 20%");
  }

  if (isNumber(input.developerWalletPercentage) && input.developerWalletPercentage > 10) {
    score -= 15;
    riskSignals.push("Developer wallet ownership above 10%");
  }

  if (isNumber(input.socialMomentum) && input.socialMomentum >= 75) {
    score += 10;
    bullishSignals.push("High social momentum");
  } else if (isNumber(input.socialMomentum) && input.socialMomentum <= 30) {
    score -= 7;
    riskSignals.push("Low social momentum");
  }

  const normalizedScore = clamp(score, 0, 100);

  return {
    score: normalizedScore,
    confidence: inferConfidenceFromCompleteness(dataCompletenessPercentage),
    dataCompletenessPercentage,
    bullishSignals,
    riskSignals,
  };
}