import { getServerEnv } from "@/lib/env";

type DiscoverySource =
  | "pumpfun-latest"
  | "birdeye-new-listings"
  | "helius-pumpfun-tx"
  | "solana-program-logs";

type DiscoveryDetail = {
  source: DiscoverySource;
  endpoint: string;
  count: number;
};

type DiscoveryResult = {
  addresses: string[];
  details: DiscoveryDetail[];
};

const PUMPFUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const PUMPFUN_API = "https://frontend-api.pump.fun";
const BIRDEYE_API = "https://public-api.birdeye.so";

function normalizeMint(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length < 32 || trimmed.length > 64) {
    return null;
  }

  return trimmed;
}

function uniqueLimit(input: string[], limit: number) {
  return [...new Set(input)].slice(0, limit);
}

async function fetchJson<T>(url: string, headers?: Record<string, string>) {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers,
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

async function postRpc<T>(rpcUrl: string, body: unknown) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

type PumpfunCoinRow = {
  mint?: string;
};

async function discoverFromPumpfun(limit: number): Promise<DiscoveryDetail & { addresses: string[] }> {
  const endpoints = [
    `${PUMPFUN_API}/coins?offset=0&limit=${limit}&sort=created_timestamp&order=DESC`,
    `${PUMPFUN_API}/coins?offset=0&limit=${limit}`,
  ];

  for (const endpoint of endpoints) {
    const json = await fetchJson<unknown>(endpoint);
    const rows = Array.isArray(json)
      ? json
      : Array.isArray((json as { data?: unknown[] } | null)?.data)
        ? (json as { data?: unknown[] }).data ?? []
        : [];

    const addresses = rows
      .map((row) => normalizeMint((row as PumpfunCoinRow)?.mint))
      .filter((value): value is string => value !== null);

    if (addresses.length > 0) {
      return {
        source: "pumpfun-latest",
        endpoint,
        count: addresses.length,
        addresses: uniqueLimit(addresses, limit),
      };
    }
  }

  return {
    source: "pumpfun-latest",
    endpoint: endpoints[0],
    count: 0,
    addresses: [],
  };
}

type BirdeyeListingRow = {
  address?: string;
  tokenAddress?: string;
  mint?: string;
};

async function discoverFromBirdeye(limit: number, apiKey?: string): Promise<DiscoveryDetail & { addresses: string[] }> {
  if (!apiKey) {
    return {
      source: "birdeye-new-listings",
      endpoint: `${BIRDEYE_API}/defi/v2/tokens/new_listing?chain=solana&limit=${limit}`,
      count: 0,
      addresses: [],
    };
  }

  const endpoint = `${BIRDEYE_API}/defi/v2/tokens/new_listing?chain=solana&limit=${limit}`;
  const json = await fetchJson<unknown>(endpoint, {
    "X-API-KEY": apiKey,
    "x-chain": "solana",
    Accept: "application/json",
  });

  const rows = Array.isArray((json as { data?: unknown[] } | null)?.data)
    ? ((json as { data?: unknown[] }).data ?? [])
    : Array.isArray((json as { data?: { items?: unknown[] } } | null)?.data?.items)
      ? (json as { data?: { items?: unknown[] } }).data?.items ?? []
      : [];

  const addresses = rows
    .map((row) => {
      const typed = row as BirdeyeListingRow;
      return normalizeMint(typed.address ?? typed.tokenAddress ?? typed.mint);
    })
    .filter((value): value is string => value !== null);

  return {
    source: "birdeye-new-listings",
    endpoint,
    count: addresses.length,
    addresses: uniqueLimit(addresses, limit),
  };
}

type RpcSignatureResponse = {
  result?: Array<{ signature?: string }>;
};

type RpcTransactionResponse = {
  result?: {
    meta?: {
      logMessages?: string[];
      postTokenBalances?: Array<{ mint?: string }>;
      preTokenBalances?: Array<{ mint?: string }>;
    };
    transaction?: {
      message?: {
        accountKeys?: Array<string | { pubkey?: string }>;
      };
    };
  };
};

function extractMintsFromTransaction(tx: RpcTransactionResponse, requireCreateLog: boolean) {
  const result = tx.result;
  if (!result) {
    return [] as string[];
  }

  const logs = result.meta?.logMessages ?? [];
  if (requireCreateLog) {
    const hasCreateSignal = logs.some((line) => line.toLowerCase().includes("instruction") && line.toLowerCase().includes("create"));
    if (!hasCreateSignal) {
      return [];
    }
  }

  const postMints = (result.meta?.postTokenBalances ?? [])
    .map((item) => normalizeMint(item.mint))
    .filter((value): value is string => value !== null);

  const preMints = (result.meta?.preTokenBalances ?? [])
    .map((item) => normalizeMint(item.mint))
    .filter((value): value is string => value !== null);

  return uniqueLimit([...postMints, ...preMints], 50);
}

async function discoverFromHelius(limit: number, rpcUrl?: string): Promise<DiscoveryDetail & { addresses: string[] }> {
  if (!rpcUrl) {
    return {
      source: "helius-pumpfun-tx",
      endpoint: "rpc:getSignaturesForAddress/getTransaction",
      count: 0,
      addresses: [],
    };
  }

  const sigResponse = await postRpc<RpcSignatureResponse>(rpcUrl, {
    jsonrpc: "2.0",
    id: 1,
    method: "getSignaturesForAddress",
    params: [PUMPFUN_PROGRAM_ID, { limit: Math.max(20, limit) }],
  });

  const signatures = (sigResponse?.result ?? [])
    .map((item) => item.signature)
    .filter((value): value is string => typeof value === "string");

  if (signatures.length === 0) {
    return {
      source: "helius-pumpfun-tx",
      endpoint: "rpc:getSignaturesForAddress/getTransaction",
      count: 0,
      addresses: [],
    };
  }

  const txResponses = await Promise.all(
    signatures.slice(0, Math.max(20, limit)).map((signature) =>
      postRpc<RpcTransactionResponse>(rpcUrl, {
        jsonrpc: "2.0",
        id: signature,
        method: "getTransaction",
        params: [signature, { maxSupportedTransactionVersion: 0, encoding: "json" }],
      }),
    ),
  );

  const addresses = uniqueLimit(
    txResponses.flatMap((tx) => extractMintsFromTransaction(tx ?? {}, true)),
    limit,
  );

  return {
    source: "helius-pumpfun-tx",
    endpoint: "rpc:getSignaturesForAddress/getTransaction",
    count: addresses.length,
    addresses,
  };
}

async function discoverFromProgramLogs(limit: number, rpcUrl?: string): Promise<DiscoveryDetail & { addresses: string[] }> {
  if (!rpcUrl) {
    return {
      source: "solana-program-logs",
      endpoint: "rpc:getSignaturesForAddress/getTransaction",
      count: 0,
      addresses: [],
    };
  }

  const sigResponse = await postRpc<RpcSignatureResponse>(rpcUrl, {
    jsonrpc: "2.0",
    id: 2,
    method: "getSignaturesForAddress",
    params: [PUMPFUN_PROGRAM_ID, { limit: Math.max(30, limit) }],
  });

  const signatures = (sigResponse?.result ?? [])
    .map((item) => item.signature)
    .filter((value): value is string => typeof value === "string");

  const txResponses = await Promise.all(
    signatures.slice(0, Math.max(30, limit)).map((signature) =>
      postRpc<RpcTransactionResponse>(rpcUrl, {
        jsonrpc: "2.0",
        id: `log-${signature}`,
        method: "getTransaction",
        params: [signature, { maxSupportedTransactionVersion: 0, encoding: "json" }],
      }),
    ),
  );

  const addresses = uniqueLimit(
    txResponses.flatMap((tx) => extractMintsFromTransaction(tx ?? {}, false)),
    limit,
  );

  return {
    source: "solana-program-logs",
    endpoint: "rpc:getSignaturesForAddress/getTransaction",
    count: addresses.length,
    addresses,
  };
}

export async function discoverRecentPumpfunTokenAddresses(limit = 30): Promise<DiscoveryResult> {
  const env = getServerEnv();
  const rpcUrl = env.HELIUS_RPC_URL ?? env.SOLANA_RPC_URL;

  const [pumpfun, birdeye, helius, logs] = await Promise.all([
    discoverFromPumpfun(limit),
    discoverFromBirdeye(limit, env.BIRDEYE_API_KEY),
    discoverFromHelius(limit, rpcUrl),
    discoverFromProgramLogs(limit, rpcUrl),
  ]);

  const addresses = uniqueLimit(
    [...pumpfun.addresses, ...birdeye.addresses, ...helius.addresses, ...logs.addresses],
    limit,
  );

  return {
    addresses,
    details: [
      { source: pumpfun.source, endpoint: pumpfun.endpoint, count: pumpfun.count },
      { source: birdeye.source, endpoint: birdeye.endpoint, count: birdeye.count },
      { source: helius.source, endpoint: helius.endpoint, count: helius.count },
      { source: logs.source, endpoint: logs.endpoint, count: logs.count },
    ],
  };
}
