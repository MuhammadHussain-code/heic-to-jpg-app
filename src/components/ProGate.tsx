import { Link } from "../lib/router";
import { isPro, useSubscription } from "../lib/subscription";

export function ProGate({
  title,
  reason,
  features,
  children,
}: {
  title: string;
  reason: string;
  features: string[];
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
    </div>
  );
}

export function ProBadge(): React.ReactElement {
  return <span className="pill pill--pro" aria-label="Pro feature">Pro</span>;
}

export function ComingSoonBadge(): React.ReactElement {
  return <span className="pill pill--soon">Coming soon</span>;
}
