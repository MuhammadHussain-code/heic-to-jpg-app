import { EarlyAccessForm } from "./EarlyAccessForm";
import { Link } from "../lib/router";
import { isPro, useSubscription } from "../lib/subscription";

export function ProGate({
  title,
  reason,
  features,
  source,
  children,
}: {
  title: string;
  reason: string;
  features: string[];
  /** Identifier passed to the waitlist form so we can track conversions per tool. */
  source: string;
  children: React.ReactNode;
}): React.ReactElement {
  const sub = useSubscription();
  if (isPro(sub)) return <>{children}</>;
  return (
    <div className="pro-gate">
      <div className="pro-gate__badge">★ Pro feature</div>
      <h2>{title}</h2>
      <p>{reason}</p>
      <ul>
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <div className="pro-gate__actions">
        <Link to="/pricing" className="btn btn--primary">
          See Pro plans
        </Link>
        <Link to="/" className="btn btn--ghost">
          Back to free tools
        </Link>
      </div>

      <div className="pro-gate__divider" aria-hidden>
        <span>or</span>
      </div>

      <EarlyAccessForm
        source={source}
        variant="inline"
        headline="Not ready to buy? Get 50% off at launch"
        subheadline="Join the early-access list and we'll email a discount code the day Pro ships."
      />
    </div>
  );
}

export function ProBadge(): React.ReactElement {
  return <span className="pill pill--pro" aria-label="Pro feature">Pro</span>;
}

export function ComingSoonBadge(): React.ReactElement {
  return <span className="pill pill--soon">Coming soon</span>;
}
