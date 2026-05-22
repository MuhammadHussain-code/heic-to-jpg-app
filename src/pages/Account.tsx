import { ConfirmButton } from "../components/ConfirmButton";
import { Link, useRoute } from "../lib/router";
import { isPro, setPlan, useSubscription } from "../lib/subscription";
import { clearHistory, useUsageStats } from "../lib/usage";
import { formatBytes } from "../lib/image";

export function Account(): React.ReactElement {
  const sub = useSubscription();
  const stats = useUsageStats();
  const route = useRoute();
  const pro = isPro(sub);
  const devPlans = route.query.get("devplans") === "1";

  return (
    <div className="page-doc">
      <h1>Your account</h1>

      <section>
        <h2>Plan</h2>
        {pro ? (
          <p>
            You're on the <strong>{sub.plan === "team" ? "Team" : "Pro"}</strong>{" "}
            plan{sub.renewsAt ? ` — renews ${new Date(sub.renewsAt).toLocaleDateString()}` : ""}.
          </p>
        ) : (
          <p>
            You're on the <strong>Free</strong> plan. Pro is launching soon —{" "}
            <Link to="/pricing">join the waitlist for 50% off</Link>.
          </p>
        )}
        {devPlans && (
          <div className="account-actions">
            <p className="muted" style={{ marginBottom: "0.5rem" }}>
              Dev preview — toggle plans to see Pro/Team UI without paying.
            </p>
            <div className="account-actions__row">
              <button
                type="button"
                className={`btn btn--ghost${sub.plan === "free" ? " is-current" : ""}`}
                onClick={() => setPlan("free")}
                disabled={sub.plan === "free"}
              >
                Free
              </button>
              <button
                type="button"
                className={`btn btn--ghost${sub.plan === "pro" ? " is-current" : ""}`}
                onClick={() => setPlan("pro")}
                disabled={sub.plan === "pro"}
              >
                Pro
              </button>
              <button
                type="button"
                className={`btn btn--ghost${sub.plan === "team" ? " is-current" : ""}`}
                onClick={() => setPlan("team")}
                disabled={sub.plan === "team"}
              >
                Team
              </button>
            </div>
          </div>
        )}
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
          <ConfirmButton
            label="Clear history"
            confirmLabel="Click again to clear"
            onConfirm={clearHistory}
          />
        </section>
      )}

      <section>
        <h2>Data</h2>
        <p>
          We store your plan and a short history of converted filenames in
          localStorage. Waitlist signups go directly to our email provider —
          nothing else leaves your device.
        </p>
      </section>
    </div>
  );
}
