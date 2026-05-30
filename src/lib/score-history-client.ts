type ScoreSnapshot = {
  timestamp: string;
  score: number;
};

type ScoreHistoryStore = Record<string, ScoreSnapshot[]>;

const STORAGE_KEY = "pumpiq-score-history-v1";
const MAX_POINTS_PER_TOKEN = 48;
const MIN_SNAPSHOT_INTERVAL_MS = 60_000;

function readStore(): ScoreHistoryStore {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as ScoreHistoryStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: ScoreHistoryStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function appendScoreSnapshot(address: string, score: number | null) {
  if (typeof window === "undefined" || score === null) {
    return;
  }

  const normalizedAddress = address.trim();
  if (!normalizedAddress) {
    return;
  }

  const now = new Date();
  const scoreValue = Math.round(Math.max(0, Math.min(100, score)));
  const store = readStore();
  const existing = store[normalizedAddress] ?? [];
  const last = existing[existing.length - 1];

  if (last) {
    const lastTime = Number(new Date(last.timestamp));
    const nowTime = Number(now);
    if (last.score === scoreValue && Number.isFinite(lastTime) && nowTime - lastTime < MIN_SNAPSHOT_INTERVAL_MS) {
      return;
    }
  }

  const next = [...existing, { timestamp: now.toISOString(), score: scoreValue }].slice(-MAX_POINTS_PER_TOKEN);
  store[normalizedAddress] = next;
  writeStore(store);
}

export function getScoreSnapshots(address: string): ScoreSnapshot[] {
  if (typeof window === "undefined") {
    return [];
  }

  const normalizedAddress = address.trim();
  if (!normalizedAddress) {
    return [];
  }

  const store = readStore();
  const entries = store[normalizedAddress] ?? [];

  return entries
    .filter((entry) => typeof entry?.timestamp === "string" && typeof entry?.score === "number")
    .sort((a, b) => Number(new Date(a.timestamp)) - Number(new Date(b.timestamp)));
}

export function toScoreHistoryChartData(snapshots: ScoreSnapshot[]) {
  return snapshots.map((snapshot) => ({
    timestamp: new Date(snapshot.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    score: snapshot.score,
  }));
}
