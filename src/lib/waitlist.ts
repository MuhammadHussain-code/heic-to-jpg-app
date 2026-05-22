import { useEffect, useState } from "react";

export type WaitlistEntry = {
  email: string;
  /** Where on the site the user signed up — useful for conversion analytics later. */
  source: string;
  at: string;
};

const STORAGE_KEY = "snapforge:waitlist";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

function read(): WaitlistEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WaitlistEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: WaitlistEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent("snapforge:waitlist-change"));
}

export type AddResult =
  | { ok: true; entry: WaitlistEntry }
  | { ok: false; reason: "invalid" | "duplicate" };

export function addToWaitlist(email: string, source: string): AddResult {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) return { ok: false, reason: "invalid" };
  const existing = read();
  if (existing.some((e) => e.email === trimmed)) {
    return { ok: false, reason: "duplicate" };
  }
  const entry: WaitlistEntry = {
    email: trimmed,
    source,
    at: new Date().toISOString(),
  };
  write([entry, ...existing]);
  return { ok: true, entry };
}

export function clearWaitlist(): void {
  write([]);
}

export function removeFromWaitlist(email: string): void {
  write(read().filter((e) => e.email !== email.toLowerCase()));
}

export function useWaitlist(): WaitlistEntry[] {
  const [list, setList] = useState<WaitlistEntry[]>(() => read());
  useEffect(() => {
    const onChange = () => setList(read());
    window.addEventListener("snapforge:waitlist-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("snapforge:waitlist-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return list;
}
