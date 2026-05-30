import { PublicKey } from "@solana/web3.js";
import { getServerEnv } from "@/lib/env";

export function isValidSolanaMintAddress(address: string) {
  try {
    const key = new PublicKey(address);
    return key.toBase58() === address;
  } catch {
    return false;
  }
}

type MintValidationResult = {
  isMint: boolean;
  error: string | null;
};

export async function validateOnChainMintAddress(address: string): Promise<MintValidationResult> {
  if (!isValidSolanaMintAddress(address)) {
    return {
      isMint: false,
      error: "Address is not a valid Solana public key.",
    };
  }

  const env = getServerEnv();
  const rpcUrl = env.SOLANA_RPC_URL;

  if (!rpcUrl) {
    return {
      isMint: false,
      error: "SOLANA_RPC_URL is not configured.",
    };
  }

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenSupply",
        params: [address],
      }),
      signal: AbortSignal.timeout(10000),
    });

    const text = await response.text();
    let parsed: unknown = null;

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    const errorMessage =
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      typeof (parsed as { error?: { message?: unknown } }).error?.message === "string"
        ? ((parsed as { error?: { message?: string } }).error?.message ?? null)
        : null;

    if (!response.ok || errorMessage) {
      return {
        isMint: false,
        error: errorMessage ?? `RPC request failed with status ${response.status}.`,
      };
    }

    return {
      isMint: true,
      error: null,
    };
  } catch (error) {
    return {
      isMint: false,
      error: error instanceof Error ? error.message : "Unknown RPC error",
    };
  }
}