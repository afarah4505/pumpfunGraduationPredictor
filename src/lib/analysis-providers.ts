import { getServerEnv } from "@/lib/env";
import type { MetricSource, RealMetricKey } from "@/lib/types";

type JsonMap = Record<string, unknown>;
type ProviderName = "Birdeye" | "Helius" | "SolanaTracker";

type HttpCapture = {
  provider: ProviderName;
  endpoint: string;
  method: "GET" | "POST";
  status: number | null;
  ok: boolean;
  body: string | null;
  json: unknown;
  error: string | null;
};

type ProviderCheck = {
  provider: ProviderName;
  exists: boolean;
  checks: HttpCapture[];
};

type ProviderTokenPayload = {
  root: unknown;
  token: unknown;
};

export type RealMetricBundle = {
  tokenName: string | null;
  symbol: string | null;
  marketCap: number | null;
  liquidity: number | null;
  volume: number | null;
  holderCount: number | null;
  buyCount: number | null;
  sellCount: number | null;
  uniqueWalletCount: number | null;
  topHolderConcentration: number | null;
  creationDate: string | null;
  currentPrice: number | null;
  priceChangePercentage: number | null;
  holderGrowthRate: number | null;
  volumeGrowthRate: number | null;
  developerWalletPercentage: number | null;
  socialMomentum: number | null;
  sourceMap: Partial<Record<RealMetricKey, MetricSource>>;
  errors: string[];
};

export type TokenDebugData = {
  inputAddress: string;
  providerOrder: ProviderName[];
  providerChecks: ProviderCheck[];
  rawResponses: HttpCapture[];
  parsedFields: Record<string, string | number | null>;
  missingFields: string[];
  providerUsed: Record<string, ProviderName | null>;
  errors: string[];
};

function logInfo(event: string, payload: unknown) {
  console.info(`[analysis:${event}]`, payload);
}

function logError(event: string, payload: unknown) {
  console.error(`[analysis:${event}]`, payload);
}

function getNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function atPath(input: unknown, path: string): unknown {
  const parts = path.split(".");
  let cursor: unknown = input;

  for (const part of parts) {
    if (!cursor || typeof cursor !== "object") {
      return null;
    }

    cursor = (cursor as JsonMap)[part];
  }

  return cursor;
}

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractTokenAddress(endpoint: string, methodBody?: unknown): string | null {
  if (endpoint.includes("/tokens/")) {
    const token = endpoint.split("/tokens/")[1]?.split("?")[0];
    return token ?? null;
  }

  if (endpoint.includes("address=")) {
    return endpoint.split("address=")[1]?.split("&")[0] ?? null;
  }

  if (methodBody && typeof methodBody === "object") {
    const body = methodBody as { params?: unknown[]; mintAccounts?: unknown[] };
    if (Array.isArray(body.params) && typeof body.params[0] === "string") {
      return body.params[0];
    }

    if (Array.isArray(body.mintAccounts) && typeof body.mintAccounts[0] === "string") {
      return body.mintAccounts[0];
    }
  }

  return null;
}

function getTokenFromResponse(data: unknown): ProviderTokenPayload {
  const candidates: unknown[] = [
    data,
    atPath(data, "data"),
    atPath(data, "data.token"),
    atPath(data, "data.items.0"),
    atPath(data, "data.items.0.token"),
    atPath(data, "result"),
    atPath(data, "result.token"),
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      const tokenFromCandidate = atPath(candidate, "token");
      if (tokenFromCandidate && typeof tokenFromCandidate === "object") {
        return { root: candidate, token: tokenFromCandidate };
      }

      return { root: candidate, token: candidate };
    }
  }

  return { root: data, token: data };
}

async function fetchWithRetry(
  endpoint: string,
  init: RequestInit,
  retries = 1,
): Promise<{ response: Response | null; error: string | null }> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await fetch(endpoint, init);
      if (response.ok || response.status < 500 || attempt === retries) {
        return { response, error: null };
      }
    } catch (error) {
      if (attempt === retries) {
        return { response: null, error: error instanceof Error ? error.message : "Unknown fetch error" };
      }
    }

    attempt += 1;
  }

  return { response: null, error: "Unknown fetch error" };
}

async function fetchJsonWithCapture(
  provider: ProviderName,
  endpoint: string,
  headers?: Record<string, string>,
): Promise<HttpCapture> {
  try {
    const fetchResult = await fetchWithRetry(
      endpoint,
      {
      method: "GET",
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(12000),
      },
      1,
    );

    if (!fetchResult.response) {
      throw new Error(fetchResult.error ?? "Unknown fetch error");
    }

    const response = fetchResult.response;

    const body = await response.text();
    const json = tryParseJson(body);

    logInfo("provider-call", {
      inputTokenAddress: extractTokenAddress(endpoint),
      provider,
      apiUrl: endpoint,
      status: response.status,
      responseJson: json,
    });

    return {
      provider,
      endpoint,
      method: "GET",
      status: response.status,
      ok: response.ok,
      body,
      json,
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";

    logError("provider-call-failed", {
      provider,
      apiUrl: endpoint,
      error: message,
    });

    return {
      provider,
      endpoint,
      method: "GET",
      status: null,
      ok: false,
      body: null,
      json: null,
      error: message,
    };
  }
}

async function postRpcWithCapture(provider: ProviderName, endpoint: string, body: unknown): Promise<HttpCapture> {
  try {
    const fetchResult = await fetchWithRetry(
      endpoint,
      {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
      },
      1,
    );

    if (!fetchResult.response) {
      throw new Error(fetchResult.error ?? "Unknown fetch error");
    }

    const response = fetchResult.response;

    const responseBody = await response.text();
    const json = tryParseJson(responseBody);

    logInfo("provider-call", {
      inputTokenAddress: extractTokenAddress(endpoint, body),
      provider,
      apiUrl: endpoint,
      status: response.status,
      responseJson: json,
    });

    return {
      provider,
      endpoint,
      method: "POST",
      status: response.status,
      ok: response.ok,
      body: responseBody,
      json,
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";

    logError("provider-call-failed", {
      provider,
      apiUrl: endpoint,
      error: message,
    });

    return {
      provider,
      endpoint,
      method: "POST",
      status: null,
      ok: false,
      body: null,
      json: null,
      error: message,
    };
  }
}

function setMetric(
  bundle: RealMetricBundle,
  field: keyof RealMetricBundle,
  value: string | number,
  source: MetricSource,
) {
  if (bundle[field] === null || bundle[field] === undefined) {
    (bundle[field] as string | number | null) = value;
    if (field in bundle.sourceMap) {
      bundle.sourceMap[field as RealMetricKey] = source;
    }
  }
}

function applyBirdeye(bundle: RealMetricBundle, capture: HttpCapture) {
  if (!capture.ok || !capture.json) {
    bundle.errors.push(`Birdeye failed: ${capture.error ?? "Unknown error"}. Body: ${capture.body ?? "<empty>"}`);
    return false;
  }

  const payload = getTokenFromResponse(capture.json);
  const data = payload.root;

  const name = getString(atPath(data, "name"));
  const symbol = getString(atPath(data, "symbol"));
  const price = getNumber(atPath(data, "price"));
  const marketCap = getNumber(atPath(data, "marketCap"));
  const liquidity = getNumber(atPath(data, "liquidity"));
  const volume = getNumber(atPath(data, "v24hUSD")) ?? getNumber(atPath(data, "volume24h"));

  if (name) {
    setMetric(bundle, "tokenName", name, { provider: "Birdeye", endpoint: capture.endpoint, path: "data.name" });
  }
  if (symbol) {
    setMetric(bundle, "symbol", symbol, { provider: "Birdeye", endpoint: capture.endpoint, path: "data.symbol" });
  }
  if (price !== null) {
    setMetric(bundle, "currentPrice", price, { provider: "Birdeye", endpoint: capture.endpoint, path: "data.price" });
  }
  if (marketCap !== null) {
    setMetric(bundle, "marketCap", marketCap, { provider: "Birdeye", endpoint: capture.endpoint, path: "data.marketCap" });
  }
  if (liquidity !== null) {
    setMetric(bundle, "liquidity", liquidity, { provider: "Birdeye", endpoint: capture.endpoint, path: "data.liquidity" });
  }
  if (volume !== null) {
    setMetric(bundle, "volume", volume, { provider: "Birdeye", endpoint: capture.endpoint, path: "data.v24hUSD" });
  }

  const holders =
    getNumber(atPath(data, "holder")) ??
    getNumber(atPath(data, "holderCount")) ??
    getNumber(atPath(data, "holders"));
  const buys = getNumber(atPath(data, "buy24h"));
  const sells = getNumber(atPath(data, "sell24h"));
  const uniqueWallets = getNumber(atPath(data, "unique_wallet_24h"));
  const createdAt = getString(atPath(data, "createdAt"));
  const priceChange = getNumber(atPath(data, "priceChange24hPercent")) ?? getNumber(atPath(data, "priceChange24h"));

  if (holders !== null) {
    setMetric(bundle, "holderCount", holders, { provider: "Birdeye", endpoint: capture.endpoint, path: "data.holder" });
  }
  if (buys !== null) {
    setMetric(bundle, "buyCount", buys, { provider: "Birdeye", endpoint: capture.endpoint, path: "data.buy24h" });
  }
  if (sells !== null) {
    setMetric(bundle, "sellCount", sells, { provider: "Birdeye", endpoint: capture.endpoint, path: "data.sell24h" });
  }
  if (uniqueWallets !== null) {
    setMetric(bundle, "uniqueWalletCount", uniqueWallets, {
      provider: "Birdeye",
      endpoint: capture.endpoint,
      path: "data.unique_wallet_24h",
    });
  }
  if (createdAt) {
    setMetric(bundle, "creationDate", createdAt, { provider: "Birdeye", endpoint: capture.endpoint, path: "data.createdAt" });
  }
  if (priceChange !== null) {
    setMetric(bundle, "priceChangePercentage", priceChange, {
      provider: "Birdeye",
      endpoint: capture.endpoint,
      path: "data.priceChange24hPercent",
    });
  }

  const holderGrowth = getNumber(atPath(data, "holderChange24hPercent")) ?? getNumber(atPath(data, "holderChange24h"));
  const volumeGrowth = getNumber(atPath(data, "v24hChangePercent")) ?? getNumber(atPath(data, "volumeChange24hPercent"));
  const devPct = getNumber(atPath(data, "creatorPercent")) ?? getNumber(atPath(data, "devHoldingsPercent"));
  const social = getNumber(atPath(data, "socialScore"));

  if (holderGrowth !== null) {
    bundle.holderGrowthRate = bundle.holderGrowthRate ?? holderGrowth;
  }
  if (volumeGrowth !== null) {
    bundle.volumeGrowthRate = bundle.volumeGrowthRate ?? volumeGrowth;
  }
  if (devPct !== null) {
    bundle.developerWalletPercentage = bundle.developerWalletPercentage ?? devPct;
  }
  if (social !== null) {
    bundle.socialMomentum = bundle.socialMomentum ?? social;
  }

  return Boolean(name || symbol || price !== null || marketCap !== null || liquidity !== null || volume !== null);
}

function applySolanaTracker(bundle: RealMetricBundle, capture: HttpCapture) {
  if (!capture.ok || !capture.json) {
    bundle.errors.push(`SolanaTracker failed: ${capture.error ?? "Unknown error"}. Body: ${capture.body ?? "<empty>"}`);
    return false;
  }

  const payload = getTokenFromResponse(capture.json);
  const pools = atPath(capture.json, "pools");
  const bestPool = Array.isArray(pools)
    ? [...pools]
        .sort((a, b) => {
          const aLiquidity = getNumber(atPath(a, "liquidity.usd")) ?? 0;
          const bLiquidity = getNumber(atPath(b, "liquidity.usd")) ?? 0;
          return bLiquidity - aLiquidity;
        })
        .at(0)
    : null;

  const name = getString(atPath(payload.token, "name")) ?? getString(atPath(capture.json, "name"));
  const symbol = getString(atPath(payload.token, "symbol")) ?? getString(atPath(capture.json, "symbol"));
  const marketCap =
    getNumber(atPath(bestPool, "marketCap.usd")) ??
    getNumber(atPath(capture.json, "marketCap.usd")) ??
    getNumber(atPath(capture.json, "marketCap"));
  const liquidity =
    getNumber(atPath(bestPool, "liquidity.usd")) ??
    getNumber(atPath(capture.json, "liquidity.usd")) ??
    getNumber(atPath(capture.json, "liquidity"));
  const volume =
    getNumber(atPath(bestPool, "txns.volume24h")) ??
    getNumber(atPath(bestPool, "txns.volume")) ??
    getNumber(atPath(capture.json, "volume.h24")) ??
    getNumber(atPath(capture.json, "volume24h"));
  const buys =
    getNumber(atPath(capture.json, "buys")) ??
    getNumber(atPath(bestPool, "txns.buys")) ??
    getNumber(atPath(capture.json, "txns.h24.buys"));
  const sells =
    getNumber(atPath(capture.json, "sells")) ??
    getNumber(atPath(bestPool, "txns.sells")) ??
    getNumber(atPath(capture.json, "txns.h24.sells"));
  const holders = getNumber(atPath(capture.json, "holders"));
  const uniqueWallets =
    getNumber(atPath(capture.json, "holders")) ??
    getNumber(atPath(capture.json, "uniqueWallets24h")) ??
    getNumber(atPath(capture.json, "uniqueWallets"));
  const createdAt =
    getString(atPath(payload.token, "creation.created_time")) ??
    getString(atPath(payload.token, "createdAt")) ??
    getString(atPath(capture.json, "createdAt"));
  const price =
    getNumber(atPath(bestPool, "price.usd")) ??
    getNumber(atPath(capture.json, "price.usd")) ??
    getNumber(atPath(capture.json, "price"));
  const priceChange =
    getNumber(atPath(capture.json, "events.24h.priceChangePercentage")) ??
    getNumber(atPath(capture.json, "priceChange.h24")) ??
    getNumber(atPath(capture.json, "priceChange24h"));

  if (name) {
    setMetric(bundle, "tokenName", name, { provider: "SolanaTracker", endpoint: capture.endpoint, path: "token.name" });
  }
  if (symbol) {
    setMetric(bundle, "symbol", symbol, { provider: "SolanaTracker", endpoint: capture.endpoint, path: "token.symbol" });
  }
  if (price !== null) {
    setMetric(bundle, "currentPrice", price, { provider: "SolanaTracker", endpoint: capture.endpoint, path: "price.usd" });
  }
  if (marketCap !== null) {
    setMetric(bundle, "marketCap", marketCap, { provider: "SolanaTracker", endpoint: capture.endpoint, path: "marketCap.usd" });
  }
  if (liquidity !== null) {
    setMetric(bundle, "liquidity", liquidity, { provider: "SolanaTracker", endpoint: capture.endpoint, path: "liquidity.usd" });
  }
  if (volume !== null) {
    setMetric(bundle, "volume", volume, { provider: "SolanaTracker", endpoint: capture.endpoint, path: "volume.h24" });
  }
  if (holders !== null) {
    setMetric(bundle, "holderCount", holders, { provider: "SolanaTracker", endpoint: capture.endpoint, path: "holders" });
  }
  if (buys !== null) {
    setMetric(bundle, "buyCount", buys, { provider: "SolanaTracker", endpoint: capture.endpoint, path: "txns.h24.buys" });
  }
  if (sells !== null) {
    setMetric(bundle, "sellCount", sells, { provider: "SolanaTracker", endpoint: capture.endpoint, path: "txns.h24.sells" });
  }
  if (uniqueWallets !== null) {
    setMetric(bundle, "uniqueWalletCount", uniqueWallets, {
      provider: "SolanaTracker",
      endpoint: capture.endpoint,
      path: "uniqueWallets24h",
    });
  }
  if (createdAt) {
    setMetric(bundle, "creationDate", createdAt, { provider: "SolanaTracker", endpoint: capture.endpoint, path: "createdAt" });
  }
  if (priceChange !== null) {
    setMetric(bundle, "priceChangePercentage", priceChange, {
      provider: "SolanaTracker",
      endpoint: capture.endpoint,
      path: "priceChange.h24",
    });
  }

  const holderGrowth = getNumber(atPath(capture.json, "holderChange24hPercent")) ?? getNumber(atPath(capture.json, "holdersChange24hPercent"));
  const volumeGrowth = getNumber(atPath(capture.json, "volumeChange24hPercent")) ?? getNumber(atPath(capture.json, "volume.h24ChangePercent"));
  const devPct =
    getNumber(atPath(capture.json, "risk.dev.percentage")) ??
    getNumber(atPath(capture.json, "creatorHoldingsPercent")) ??
    getNumber(atPath(capture.json, "developerHoldingsPercent"));
  const topHolders = getNumber(atPath(capture.json, "risk.top10"));
  const social = getNumber(atPath(capture.json, "socialScore"));

  if (holderGrowth !== null) {
    bundle.holderGrowthRate = bundle.holderGrowthRate ?? holderGrowth;
  }
  if (volumeGrowth !== null) {
    bundle.volumeGrowthRate = bundle.volumeGrowthRate ?? volumeGrowth;
  }
  if (devPct !== null) {
    bundle.developerWalletPercentage = bundle.developerWalletPercentage ?? devPct;
  }
  if (topHolders !== null) {
    bundle.topHolderConcentration = bundle.topHolderConcentration ?? topHolders;
  }
  if (social !== null) {
    bundle.socialMomentum = bundle.socialMomentum ?? social;
  }

  return Boolean(name || symbol || price !== null || marketCap !== null || liquidity !== null || volume !== null);
}

function applyHeliusMetadata(bundle: RealMetricBundle, capture: HttpCapture) {
  if (!capture.ok || !capture.json) {
    bundle.errors.push(`Helius metadata failed: ${capture.error ?? "Unknown error"}. Body: ${capture.body ?? "<empty>"}`);
    return false;
  }

  const first = Array.isArray(capture.json) ? capture.json[0] : null;
  const onChainName = getString(atPath(first, "onChainMetadata.metadata.data.name"));
  const onChainSymbol = getString(atPath(first, "onChainMetadata.metadata.data.symbol"));

  if (onChainName) {
    setMetric(bundle, "tokenName", onChainName, {
      provider: "Helius",
      endpoint: capture.endpoint,
      path: "[0].onChainMetadata.metadata.data.name",
    });
  }
  if (onChainSymbol) {
    setMetric(bundle, "symbol", onChainSymbol, {
      provider: "Helius",
      endpoint: capture.endpoint,
      path: "[0].onChainMetadata.metadata.data.symbol",
    });
  }

  return Boolean(onChainName || onChainSymbol);
}

function applyHolderConcentration(bundle: RealMetricBundle, largestCapture: HttpCapture, supplyCapture: HttpCapture) {
  const largest = atPath(largestCapture.json, "result.value");
  const supplyAmount = getNumber(atPath(supplyCapture.json, "result.value.amount"));

  if (!Array.isArray(largest) || !supplyAmount || supplyAmount <= 0) {
    bundle.errors.push(
      `Helius concentration failed. largest=${largestCapture.body ?? "<empty>"} supply=${supplyCapture.body ?? "<empty>"}`,
    );
    return;
  }

  const top10Amount = largest
    .slice(0, 10)
    .map((item) => getNumber(atPath(item, "amount")))
    .filter((value): value is number => value !== null)
    .reduce((sum, value) => sum + value, 0);

  bundle.topHolderConcentration = (top10Amount / supplyAmount) * 100;
  bundle.sourceMap.topHolderConcentration = {
    provider: "Helius",
    endpoint: largestCapture.endpoint,
    path: "getTokenLargestAccounts.result.value[].amount / getTokenSupply.result.value.amount",
  };
}

async function collectMetrics(address: string): Promise<{ bundle: RealMetricBundle; debug: TokenDebugData }> {
  const env = getServerEnv();
  const bundle: RealMetricBundle = {
    tokenName: null,
    symbol: null,
    marketCap: null,
    liquidity: null,
    volume: null,
    holderCount: null,
    buyCount: null,
    sellCount: null,
    uniqueWalletCount: null,
    topHolderConcentration: null,
    creationDate: null,
    currentPrice: null,
    priceChangePercentage: null,
    holderGrowthRate: null,
    volumeGrowthRate: null,
    developerWalletPercentage: null,
    socialMomentum: null,
    sourceMap: {},
    errors: [],
  };

  const providerOrder: ProviderName[] = ["Birdeye", "Helius", "SolanaTracker"];
  const checks: ProviderCheck[] = [];
  const rawResponses: HttpCapture[] = [];

  logInfo("token-search", { inputTokenAddress: address, fallbackOrder: providerOrder });

  const birdeyeChecks: HttpCapture[] = [];
  let birdeyeExists = false;
  if (!env.BIRDEYE_API_KEY) {
    bundle.errors.push("BIRDEYE_API_KEY is not configured.");
  } else {
    const overviewEndpoint = `https://public-api.birdeye.so/defi/token_overview?address=${address}`;
    const holderEndpoint = `https://public-api.birdeye.so/defi/v3/token/holder?address=${address}&offset=0&limit=10`;
    const headers = {
      "X-API-KEY": env.BIRDEYE_API_KEY,
      "x-chain": "solana",
      Accept: "application/json",
    };

    const overviewCapture = await fetchJsonWithCapture("Birdeye", overviewEndpoint, headers);
    birdeyeChecks.push(overviewCapture);
    rawResponses.push(overviewCapture);
    birdeyeExists = applyBirdeye(bundle, overviewCapture);

    const holderCapture = await fetchJsonWithCapture("Birdeye", holderEndpoint, headers);
    birdeyeChecks.push(holderCapture);
    rawResponses.push(holderCapture);

    const holderItems = atPath(holderCapture.json, "data.items");
    if (Array.isArray(holderItems) && holderItems.length > 0) {
      const concentrations = holderItems
        .slice(0, 10)
        .map((item) => getNumber(atPath(item, "percentage")) ?? getNumber(atPath(item, "ratio")))
        .filter((value): value is number => value !== null);

      if (concentrations.length > 0) {
        bundle.topHolderConcentration = concentrations.reduce((sum, value) => sum + value, 0);
        bundle.sourceMap.topHolderConcentration = {
          provider: "Birdeye",
          endpoint: holderEndpoint,
          path: "data.items[].percentage",
        };
      }
    }
  }
  checks.push({ provider: "Birdeye", exists: birdeyeExists, checks: birdeyeChecks });

  const heliusChecks: HttpCapture[] = [];
  let heliusExists = false;
  if (!env.HELIUS_API_KEY) {
    bundle.errors.push("HELIUS_API_KEY is not configured for metadata lookup.");
  } else {
    const metadataEndpoint = `https://api.helius.xyz/v0/tokens/metadata?api-key=${env.HELIUS_API_KEY}`;
    const metadataCapture = await postRpcWithCapture("Helius", metadataEndpoint, {
      mintAccounts: [address],
      includeOffChain: false,
      disableCache: true,
    });
    heliusChecks.push(metadataCapture);
    rawResponses.push(metadataCapture);
    heliusExists = applyHeliusMetadata(bundle, metadataCapture);
  }

  const rpcEndpoint = env.HELIUS_RPC_URL ?? (env.HELIUS_API_KEY ? `https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}` : env.SOLANA_RPC_URL);
  if (!rpcEndpoint) {
    bundle.errors.push("HELIUS_RPC_URL or SOLANA_RPC_URL is not configured for RPC checks.");
  } else {
    const largestCapture = await postRpcWithCapture("Helius", rpcEndpoint, {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenLargestAccounts",
      params: [address],
    });
    const supplyCapture = await postRpcWithCapture("Helius", rpcEndpoint, {
      jsonrpc: "2.0",
      id: 2,
      method: "getTokenSupply",
      params: [address],
    });

    heliusChecks.push(largestCapture, supplyCapture);
    rawResponses.push(largestCapture, supplyCapture);

    if (bundle.topHolderConcentration === null) {
      applyHolderConcentration(bundle, largestCapture, supplyCapture);
    }
  }

  checks.push({ provider: "Helius", exists: heliusExists, checks: heliusChecks });

  const trackerChecks: HttpCapture[] = [];
  let trackerExists = false;
  if (!env.SOLANA_TRACKER_API_KEY) {
    bundle.errors.push("SOLANA_TRACKER_API_KEY is not configured.");
  } else {
    const endpoint = `https://data.solanatracker.io/tokens/${address}`;
    const trackerCapture = await fetchJsonWithCapture("SolanaTracker", endpoint, {
      "x-api-key": env.SOLANA_TRACKER_API_KEY,
      Accept: "application/json",
    });
    trackerChecks.push(trackerCapture);
    rawResponses.push(trackerCapture);
    trackerExists = applySolanaTracker(bundle, trackerCapture);
  }
  checks.push({ provider: "SolanaTracker", exists: trackerExists, checks: trackerChecks });

  const parsedFields: Record<string, string | number | null> = {
    name: bundle.tokenName,
    symbol: bundle.symbol,
    price: bundle.currentPrice,
    marketCap: bundle.marketCap,
    liquidity: bundle.liquidity,
    volume: bundle.volume,
  };

  const missingFields = Object.entries(parsedFields)
    .filter(([, value]) => value === null)
    .map(([key]) => key);

  const providerUsed: Record<string, ProviderName | null> = {
    name: bundle.sourceMap.tokenName?.provider ?? null,
    symbol: bundle.sourceMap.symbol?.provider ?? null,
    price: bundle.sourceMap.currentPrice?.provider ?? null,
    marketCap: bundle.sourceMap.marketCap?.provider ?? null,
    liquidity: bundle.sourceMap.liquidity?.provider ?? null,
    volume: bundle.sourceMap.volume?.provider ?? null,
  };

  return {
    bundle,
    debug: {
      inputAddress: address,
      providerOrder,
      providerChecks: checks,
      rawResponses,
      parsedFields,
      missingFields,
      providerUsed,
      errors: bundle.errors,
    },
  };
}

export async function fetchRealTokenMetrics(address: string): Promise<RealMetricBundle> {
  const { bundle } = await collectMetrics(address);
  return bundle;
}

export async function fetchTokenDebugData(address: string): Promise<TokenDebugData> {
  const { debug } = await collectMetrics(address);
  return debug;
}
