import { useEffect, useRef, useState } from "react";

// The form is hydrated by MailerLite's universal.js (loaded from index.html).
// MailerLite scans the DOM on script load and watches for new .ml-embedded
// divs after that. In a hash-routed SPA the React tree mounts AFTER that
// initial scan, and on some browsers / build orderings the MutationObserver
// doesn't catch the late-arriving div. We poke ml() on mount to nudge a
// re-render, and fall back to MailerLite's hosted form page if nothing
// has appeared after a few seconds (covers ad-blockers / CSP / etc.).
//
// To swap forms in MailerLite, update MAILERLITE_FORM_ID and the
// ml('account', ...) call in index.html.

const MAILERLITE_FORM_ID = "cbmNHz";
const MAILERLITE_ACCOUNT_ID = "2370410";
const HOSTED_FORM_URL = `https://landing.mailerlite.com/webforms/landing/${MAILERLITE_FORM_ID}`;

declare global {
  interface Window {
    ml?: (...args: unknown[]) => void;
  }
}

export function EarlyAccessForm({
  variant = "card",
  headline,
  subheadline,
}: {
  /** Tag for which placement this is — used for our own conversion analytics
   * once we add it. Currently unused since MailerLite doesn't expose a way
   * to inject a hidden field per-embed. */
  source?: string;
  variant?: "card" | "inline" | "banner" | "modal";
  headline?: string;
  subheadline?: string;
}): React.ReactElement {
  const embedRef = useRef<HTMLDivElement | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    // Best-effort: poke MailerLite's queue function to re-scan / re-render.
    // The exact command name has varied across versions of universal.js;
    // we try the documented ones and ignore any that don't match.
    if (typeof window.ml === "function") {
      try { window.ml("account", MAILERLITE_ACCOUNT_ID); } catch { /* noop */ }
      try { window.ml("webforms", "render"); } catch { /* noop */ }
      try { window.ml("forms", "render"); } catch { /* noop */ }
    }

    // If MailerLite hasn't injected a form (or iframe) into our embed div
    // after 4 seconds, the script is almost certainly blocked. Surface the
    // hosted-form fallback so the user can still sign up.
    const t = window.setTimeout(() => {
      const div = embedRef.current;
      if (!div) return;
      const hasContent = div.querySelector("form, iframe, input");
      if (!hasContent) setFallback(true);
    }, 4000);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={`waitlist waitlist--${variant}`}>
      <div className="waitlist__copy">
        <p className="waitlist__eyebrow">★ Early access</p>
        <h3>{headline ?? "Get 50% off when Pro launches"}</h3>
        <p>
          {subheadline ??
            "Pro is in private beta. Drop your email and we'll send you a launch-day discount code — plus first dibs on the Background Remover and Batch Rename tools."}
        </p>
      </div>
      <div
        ref={embedRef}
        className="ml-embedded"
        data-form={MAILERLITE_FORM_ID}
      />
      {fallback && (
        <a
          className="btn btn--primary waitlist__fallback"
          href={HOSTED_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open the signup form →
        </a>
      )}
      <p className="waitlist__legal">
        Unsubscribe anytime. We'll never share your email or send more than one
        update per month.
        {fallback && (
          <> Trouble seeing the form? An ad-blocker may be hiding it — use the button above instead.</>
        )}
      </p>
    </div>
  );
}
