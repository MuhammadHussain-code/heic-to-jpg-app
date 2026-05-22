import { useEffect, useState } from "react";

export type WaitlistEntry = {
  email: string;
  /** Where on the site the user signed up — useful for conversion analytics later. */
  source: string;
  at: string;
};

const STORAGE_KEY = "snapforge:waitlist";

// Public IDs from the MailerLite embed snippet — ship in HTML anyway, not secrets.
// To swap the form, replace these with the values from the new embed snippet.
const MAILERLITE_ACCOUNT_ID = "2370410";
const MAILERLITE_FORM_ID = "cbmNHz";
const MAILERLITE_ENDPOINT = `https://assets.mailerlite.com/jsonp/${MAILERLITE_ACCOUNT_ID}/forms/${MAILERLITE_FORM_ID}/subscribe`;

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
  | { ok: false; reason: "invalid" | "duplicate" | "network" };

async function postToMailerLite(email: string, source: string): Promise<boolean> {
  const body = new URLSearchParams();
  body.set("fields[email]", email);
  // Sent as a custom field; MailerLite silently ignores it unless a "source"
  // field is defined on the form, so this is safe either way.
  body.set("fields[source]", source);
  body.set("ml-submit", "1");
  body.set("anticsrf", "true");

  // MailerLite's JSONP endpoint serves Access-Control-Allow-Origin: *, so a
  // regular cors fetch works. If the body parse fails (e.g. they wrap in a
  // JSONP callback), assume the POST itself landed — that's what their own
  // embed widget does.
  const res = await fetch(MAILERLITE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) return false;
  try {
    const data = (await res.json()) as { success?: boolean };
    return data.success !== false;
  } catch {
    return true;
  }
}

export async function addToWaitlist(email: string, source: string): Promise<AddResult> {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) return { ok: false, reason: "invalid" };
  const existing = read();
  if (existing.some((e) => e.email === trimmed)) {
    return { ok: false, reason: "duplicate" };
  }

  try {
    const delivered = await postToMailerLite(trimmed, source);
    if (!delivered) return { ok: false, reason: "network" };
  } catch {
    return { ok: false, reason: "network" };
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
