import { Link } from "../lib/router";
import { isPro, setPlan, useSubscription } from "../lib/subscription";
import { clearHistory, useUsageStats } from "../lib/usage";
import { formatBytes } from "../lib/image";

export function Account(): React.ReactElement {
  const sub = useSubscription();
  const stats = useUsageStats();
  const pro = isPro(sub);

  return (
    <div className="page-doc">
      <h1>Your account</h1>

      <section>
        <h2>Plan</h2>
        <p>
          You're on the <strong>{sub.plan === "team" ? "Team" : sub.plan === "pro" ? "Pro" : "Free"}</strong>{" "}
          plan{sub.renewsAt ? ` — renews ${new Date(sub.renewsAt).toLocaleDateString()}` : ""}.
        </p>
        <div className="account-actions">
          {pro ? (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (confirm("Downgrade to Free? You'll lose access to Pro tools at the end of your period.")) {
                  setPlan("free");
                }
              }}
            >
              Cancel subscription
            </button>
          ) : (
            <Link to="/pricing" className="btn btn--primary">
              See Pro plans
            </Link>
          )}
        </div>
      </section>

      <section>
        <h2>Usage on this device</h2>
        <div className="stats-grid">
          <div className="stats-grid__cell">
            <strong>{stats.totalConversions.toLocaleString()}</strong>
            <span>conversions</span>
          </div>
          <div className="stats-grid__cell">
            <strong>{formatBytes(stats.bytesSaved)}</strong>
            <span>bytes saved</span>
          </div>
          <div className="stats-grid__cell">
            <strong>{stats.recent.length}</strong>
            <span>in recent history</span>
          </div>
        </div>
      </section>

      {stats.recent.length > 0 && (
        <section>
          <h2>Recent conversions</h2>
          <ul className="recent-list">
            {stats.recent.map((entry) => (
              <li key={entry.id}>
                <span className="recent-list__tool">{entry.tool}</span>
                <span className="recent-list__name">{entry.filename}</span>
                <span className="recent-list__size">
                  {formatBytes(entry.bytesIn)} → {formatBytes(entry.bytesOut)}
                </span>
                <span className="recent-list__date">
                  {new Date(entry.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              if (confirm("Clear local conversion history?")) clearHistory();
            }}
          >
            Clear history
          </button>
        </section>
      )}

      <section>
        <h2>Data</h2>
        <p>
          We store your plan and a short history of converted filenames in
          localStorage. Clear it from your browser settings, or use the button
          above. None of this data leaves your device.
        </p>
      </section>
    </div>
  );
}
