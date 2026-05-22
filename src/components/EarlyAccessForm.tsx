import { useState } from "react";
import { addToWaitlist, isValidEmail } from "../lib/waitlist";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; email: string }
  | { kind: "error"; message: string };

export function EarlyAccessForm({
  source,
  variant = "card",
  headline,
  subheadline,
}: {
  /** Tag stored on each signup so we can see which placement converts. */
  source: string;
  variant?: "card" | "inline" | "banner";
  headline?: string;
  subheadline?: string;
}): React.ReactElement {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setState({ kind: "error", message: "Please enter a valid email address." });
      return;
    }
    setState({ kind: "submitting" });
    // Simulate a tiny latency for nicer UX feedback; the call is sync.
    setTimeout(() => {
      const result = addToWaitlist(email, source);
      if (result.ok) {
        setState({ kind: "success", email: result.entry.email });
        setEmail("");
      } else if (result.reason === "duplicate") {
        setState({
          kind: "error",
          message: "You're already on the list — we'll be in touch.",
        });
      } else {
        setState({ kind: "error", message: "That email doesn't look valid." });
      }
    }, 250);
  };

  if (state.kind === "success") {
    return (
      <div className={`waitlist waitlist--${variant} waitlist--success`}>
        <div className="waitlist__success-mark" aria-hidden>✓</div>
        <h3>You're on the list</h3>
        <p>
          We'll email <strong>{state.email}</strong> the moment Pro launches —
          with your <strong>50% off</strong> launch discount code.
        </p>
      </div>
    );
  }

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
      <form className="waitlist__form" onSubmit={submit} noValidate>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.kind === "error") setState({ kind: "idle" });
          }}
          required
          aria-label="Email address"
          autoComplete="email"
          disabled={state.kind === "submitting"}
        />
        <button
          type="submit"
          className="btn btn--primary"
          disabled={state.kind === "submitting"}
        >
          {state.kind === "submitting" ? "Joining…" : "Get early access"}
        </button>
      </form>
      {state.kind === "error" && (
        <p className="waitlist__error" role="alert">
          {state.message}
        </p>
      )}
      <p className="waitlist__legal">
        Unsubscribe anytime. We'll never share your email or send more than one
        update per month.
      </p>
    </div>
  );
}
