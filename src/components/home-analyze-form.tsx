"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function isLikelyBase58Mint(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function normalizeAddressInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (isLikelyBase58Mint(trimmed)) {
    return trimmed;
  }

  const candidates: string[] = [];

  try {
    const parsed = new URL(trimmed);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    candidates.push(...pathParts);

    const queryValues = [
      parsed.searchParams.get("address"),
      parsed.searchParams.get("mint"),
      parsed.searchParams.get("token"),
      parsed.searchParams.get("ca"),
    ].filter(Boolean) as string[];
    candidates.push(...queryValues);
  } catch {
    // Not a URL, continue with tokenized raw text fallback.
  }

  candidates.push(...trimmed.split(/[^1-9A-HJ-NP-Za-km-z]+/g));

  const normalized = candidates.find((part) => isLikelyBase58Mint(part));
  return normalized ?? trimmed;
}

export function HomeAnalyzeForm() {
  const router = useRouter();
  const [address, setAddress] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = normalizeAddressInput(address);
    if (!trimmed) {
      return;
    }

    router.push(`/dashboard?address=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-border/70 bg-background-panel/80 p-3 sm:grid-cols-[1fr_auto]">
      <Input
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        placeholder="Paste Pump.fun URL or token mint"
        aria-label="Pump.fun URL or token mint"
      />
      <Button size="lg" className="w-full sm:w-auto" type="submit" disabled={!address.trim()}>
        Run Prediction
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
