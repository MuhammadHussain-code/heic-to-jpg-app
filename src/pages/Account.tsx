import { Link } from "../lib/router";
import { isPro, setPlan, useSubscription } from "../lib/subscription";
import { clearHistory, useUsageStats } from "../lib/usage";
import { clearWaitlist, removeFromWaitlist, useWaitlist } from "../lib/waitlist";
import { formatBytes } from "../lib/image";

export function Account(): React.ReactElement {
  const sub = useSubscription();
  const stats = useUsageStats();
  const waitlist = useWaitlist();
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

      {waitlist.length > 0 && (
        <section>
          <h2>Early-access signups on this device</h2>
          <p className="muted">
            Signups are sent to MailerLite — the full list lives in your
            MailerLite dashboard. The entries below are a local mirror of what
            was submitted from this browser, kept for quick reference.
          </p>
          <ul className="waitlist-admin">
            {waitlist.map((entry) => (
              <li key={entry.email}>
                <span className="waitlist-admin__email">{entry.email}</span>
                <span className="waitlist-admin__source">via {entry.source}</span>
                <span className="waitlist-admin__date">
                  {new Date(entry.at).toLocaleString()}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    if (confirm(`Remove ${entry.email} from waitlist?`)) {
                      removeFromWaitlist(entry.email);
                    }
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              if (confirm("Clear all waitlist signups?")) clearWaitlist();
            }}
          >
            Clear waitlist
          </button>
        </section>
      )}

      <section>
        <h2>Data</h2>
        <p>
          We store your plan, a short history of converted filenames, and any
          early-access signups in localStorage. Clear them from your browser
          settings, or use the buttons above. None of this data leaves your
          device.
        </p>
      </section>
    </div>
  );
}
