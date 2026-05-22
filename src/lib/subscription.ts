import { useEffect, useState } from "react";

export type Plan = "free" | "pro" | "team";

export type SubscriptionState = {
  plan: Plan;
  /** ISO date string if the plan has an expiry. */
  renewsAt?: string;
};

const STORAGE_KEY = "snapforge:subscription";

const FREE_DEFAULTS: SubscriptionState = { plan: "free" };

function read(): SubscriptionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return FREE_DEFAULTS;
    const parsed = JSON.parse(raw) as SubscriptionState;
    if (parsed.plan === "pro" || parsed.plan === "team" || parsed.plan === "free") {
      return parsed;
    }
    return FREE_DEFAULTS;
  } catch {
    return FREE_DEFAULTS;
  }
}

function write(state: SubscriptionState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("snapforge:subscription-change"));
}

export function getSubscription(): SubscriptionState {
  return read();
}

export function setPlan(plan: Plan): void {
  if (plan === "free") {
    write({ plan: "free" });
    return;
  }
  const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  write({ plan, renewsAt });
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>(() => read());
  useEffect(() => {
    const onChange = () => setState(read());
    window.addEventListener("snapforge:subscription-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("snapforge:subscription-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return state;
}

export function isPro(state: SubscriptionState): boolean {
  return state.plan === "pro" || state.plan === "team";
}

/** Free-tier batch size limit; Pro is unlimited. */
export const FREE_BATCH_LIMIT = 20;
/** Free-tier per-file size limit in bytes (50 MB). */
export const FREE_FILE_SIZE_LIMIT = 50 * 1024 * 1024;
