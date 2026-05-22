import { useEffect, useState } from "react";

const STORAGE_KEY = "snapforge:usage";
const MAX_HISTORY = 20;

export type UsageEntry = {
  id: string;
  tool: string;
  filename: string;
  bytesIn: number;
  bytesOut: number;
  at: string;
};

export type UsageStats = {
  totalConversions: number;
  bytesSaved: number;
  recent: UsageEntry[];
};

const DEFAULT: UsageStats = {
  totalConversions: 0,
  bytesSaved: 0,
  recent: [],
};

function read(): UsageStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as UsageStats;
    return {
      totalConversions: parsed.totalConversions ?? 0,
      bytesSaved: parsed.bytesSaved ?? 0,
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
    };
  } catch {
    return DEFAULT;
  }
}

function write(stats: UsageStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  window.dispatchEvent(new CustomEvent("snapforge:usage-change"));
}

export function recordConversion(entry: Omit<UsageEntry, "id" | "at">): void {
  const stats = read();
  const newEntry: UsageEntry = {
    ...entry,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };
  const saved = Math.max(0, entry.bytesIn - entry.bytesOut);
  write({
    totalConversions: stats.totalConversions + 1,
    bytesSaved: stats.bytesSaved + saved,
    recent: [newEntry, ...stats.recent].slice(0, MAX_HISTORY),
  });
}

export function clearHistory(): void {
  write(DEFAULT);
}

export function useUsageStats(): UsageStats {
  const [stats, setStats] = useState<UsageStats>(() => read());
  useEffect(() => {
    const onChange = () => setStats(read());
    window.addEventListener("snapforge:usage-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("snapforge:usage-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return stats;
}
