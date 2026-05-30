#!/usr/bin/env node

const TEST_MINT = "AhRwuhatGASosZNog2GbJGrMf68coNuYqsBjEbR3pump";

const birdeyeKey = process.env.BIRDEYE_API_KEY;
const trackerKey = process.env.SOLANA_TRACKER_API_KEY;
const heliusKey = process.env.HELIUS_API_KEY;

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function callBirdeye(address) {
  if (!birdeyeKey) {
    return { provider: "Birdeye", ok: false, reason: "BIRDEYE_API_KEY missing" };
  }

  const url = `https://public-api.birdeye.so/defi/token_overview?address=${address}`;
  const response = await fetch(url, {
    headers: {
      "X-API-KEY": birdeyeKey,
      "x-chain": "solana",
      Accept: "application/json",
    },
  });

  const raw = await response.text();
  const json = parseJsonSafe(raw);
  const data = json?.data;

  return {
    provider: "Birdeye",
    ok: response.ok && Boolean(data?.name || data?.symbol),
    status: response.status,
    parsed: {
      name: data?.name ?? null,
      symbol: data?.symbol ?? null,
      price: data?.price ?? null,
      marketCap: data?.marketCap ?? null,
      liquidity: data?.liquidity ?? null,
      volume: data?.v24hUSD ?? data?.volume24h ?? null,
    },
    raw,
  };
}

async function callSolanaTracker(address) {
  if (!trackerKey) {
    return { provider: "SolanaTracker", ok: false, reason: "SOLANA_TRACKER_API_KEY missing" };
  }

  const url = `https://data.solanatracker.io/tokens/${address}`;
  const response = await fetch(url, {
    headers: {
      "x-api-key": trackerKey,
      Accept: "application/json",
    },
  });

  const raw = await response.text();
  const json = parseJsonSafe(raw);

  return {
    provider: "SolanaTracker",
    ok: response.ok && Boolean(json?.token?.name || json?.name || json?.token?.symbol || json?.symbol),
    status: response.status,
    parsed: {
      name: json?.token?.name ?? json?.name ?? null,
      symbol: json?.token?.symbol ?? json?.symbol ?? null,
      price: json?.price?.usd ?? json?.price ?? null,
      marketCap: json?.marketCap?.usd ?? json?.marketCap ?? null,
      liquidity: json?.liquidity?.usd ?? json?.liquidity ?? null,
      volume: json?.volume?.h24 ?? json?.volume24h ?? null,
    },
    raw,
  };
}

async function callHelius(address) {
  if (!heliusKey) {
    return { provider: "Helius", ok: false, reason: "HELIUS_API_KEY missing" };
  }

  const url = `https://api.helius.xyz/v0/tokens/metadata?api-key=${heliusKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mintAccounts: [address], includeOffChain: false }),
  });

  const raw = await response.text();
  const json = parseJsonSafe(raw);
  const first = Array.isArray(json) ? json[0] : null;

  return {
    provider: "Helius",
    ok: response.ok && Boolean(first?.onChainMetadata?.metadata?.data?.name || first?.onChainMetadata?.metadata?.data?.symbol),
    status: response.status,
    parsed: {
      name: first?.onChainMetadata?.metadata?.data?.name ?? null,
      symbol: first?.onChainMetadata?.metadata?.data?.symbol ?? null,
      price: null,
      marketCap: null,
      liquidity: null,
      volume: null,
    },
    raw,
  };
}

async function run() {
  console.log(`[metadata-test] mint=${TEST_MINT}`);

  const birdeye = await callBirdeye(TEST_MINT);
  const tracker = await callSolanaTracker(TEST_MINT);
  const helius = await callHelius(TEST_MINT);

  const results = [birdeye, tracker, helius];

  for (const item of results) {
    console.log(`[metadata-test] provider=${item.provider}`);
    console.log(JSON.stringify(item, null, 2));
  }

  const success = results.some((item) => item.ok);

  if (!success) {
    console.error("[metadata-test] FAILED: no provider returned token metadata");
    process.exit(1);
  }

  console.log("[metadata-test] PASSED: metadata returned by at least one provider");
}

run().catch((error) => {
  console.error("[metadata-test] crashed", error);
  process.exit(1);
});
