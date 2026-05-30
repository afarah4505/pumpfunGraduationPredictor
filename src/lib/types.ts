export type ConfidenceLevel = "Low" | "Medium" | "High";

export type RealMetricKey =
  | "tokenName"
  | "symbol"
  | "marketCap"
  | "liquidity"
  | "volume"
  | "holderCount"
  | "buyCount"
  | "sellCount"
  | "uniqueWalletCount"
  | "topHolderConcentration"
  | "creationDate"
  | "currentPrice"
  | "priceChangePercentage";

export type MetricSource = {
  provider: "Birdeye" | "Helius" | "SolanaTracker";
  endpoint: string;
  path: string;
};

export type UnifiedTokenMarket = {
  price: number | null;
  marketCap: number | null;
  liquidity: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
};

export type UnifiedTokenActivity = {
  buyCount: number | null;
  sellCount: number | null;
  transactions: number | null;
};

export type UnifiedTokenHolders = {
  total: number | null;
  unique: number | null;
  topHolderPercent: number | null;
};

export type UnifiedTokenData = {
  name: string | null;
  symbol: string | null;
  address: string;
  market: UnifiedTokenMarket;
  activity: UnifiedTokenActivity;
  holders: UnifiedTokenHolders;
};

export type TokenMetricsInput = {
  holderGrowthRate: number | null;
  volumeGrowthRate: number | null;
  transactionCount: number | null;
  buySellRatio: number | null;
  marketCap: number | null;
  uniqueWalletCount: number | null;
  topHolderPercentage: number | null;
  developerWalletPercentage: number | null;
  socialMomentum: number | null;
};

export type ScoreResult = {
  score: number;
  confidence: ConfidenceLevel;
  dataCompletenessPercentage: number;
  bullishSignals: string[];
  riskSignals: string[];
};

export type TokenAnalysis = {
  address: string;
  isGraduated: boolean;
  name: string | null;
  symbol: string | null;
  marketCap: number | null;
  liquidity: number | null;
  holderCount: number | null;
  uniqueWalletCount: number | null;
  volume: number | null;
  buyCount: number | null;
  sellCount: number | null;
  buySellRatio: number | null;
  holderGrowthRate: number | null;
  volumeGrowthRate: number | null;
  transactionCount: number | null;
  developerWalletPercentage: number | null;
  socialMomentum: number | null;
  topHolderPercentage: number | null;
  creationDate: string | null;
  currentPrice: number | null;
  priceChangePercentage: number | null;
  score: number | null;
  confidence: ConfidenceLevel | null;
  bullishSignals: string[];
  riskSignals: string[];
  estimatedTimeToGraduation: string | null;
  category: "Low Probability" | "Moderate Probability" | "High Probability" | "Very High Probability" | "Insufficient data";
  scoreHistory: Array<{ timestamp: string; score: number }>;
  holderDistribution: Array<{ name: string; percentage: number }>;
  growthTrends: Array<{ day: string; holders: number; volume: number }>;
  dataSource: "live";
  normalized: UnifiedTokenData;
  dataCompletenessPercentage: number;
  sourceMap: Partial<Record<RealMetricKey, MetricSource>>;
  metricErrors: string[];
  missingMetrics: RealMetricKey[];
  missingScoreInputs: Array<keyof TokenMetricsInput>;
  insufficientData: boolean;
};

export type TrendingSortBy =
  | "score"
  | "holderGrowthRate"
  | "buySellRatio"
  | "volumeGrowthRate"
  | "uniqueWalletCount";