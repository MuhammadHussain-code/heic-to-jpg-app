import { useState } from "react";
import { Link } from "../lib/router";
import { isPro, setPlan, useSubscription } from "../lib/subscription";

type Billing = "monthly" | "yearly";

export function Pricing(): React.ReactElement {
  const [billing, setBilling] = useState<Billing>("yearly");
  const sub = useSubscription();
  const pro = isPro(sub);

  const proPrice = billing === "monthly" ? "$5" : "$3.50";
  const teamPrice = billing === "monthly" ? "$19" : "$15";

  return (
    <div className="page-pricing">
      <header className="pricing-head">
        <h1>Simple pricing</h1>
        <p>
          Free for everyday use. Upgrade when you need bigger batches, larger files,
          and the advanced tools.
        </p>
        <div className="pricing-toggle">
          <button
            type="button"
            className={`pricing-toggle__opt${billing === "monthly" ? " is-on" : ""}`}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`pricing-toggle__opt${billing === "yearly" ? " is-on" : ""}`}
            onClick={() => setBilling("yearly")}
          >
            Yearly <span className="pill pill--saving">−30%</span>
          </button>
        </div>
      </header>

      <div className="pricing-grid">
        <article className={`pricing-card${sub.plan === "free" ? " is-current" : ""}`}>
          <header>
            <h2>Free</h2>
            <p className="pricing-card__price">
              <strong>$0</strong>
              <small>forever</small>
            </p>
            <p className="pricing-card__lede">Everyday image conversion, ad-supported.</p>
          </header>
          <ul>
            <li>✓ HEIC → JPG, PNG, WebP conversion</li>
            <li>✓ Compress, resize, rotate</li>
            <li>✓ EXIF viewer & stripping</li>
            <li>✓ Color picker</li>
            <li>✓ 20 files per batch, 50 MB per file</li>
            <li className="muted">· Includes ads</li>
          </ul>
          {sub.plan === "free" ? (
            <button type="button" className="btn btn--ghost btn--block" disabled>
              Your current plan
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={() => setPlan("free")}
            >
              Downgrade to Free
            </button>
          )}
        </article>

        <article className={`pricing-card pricing-card--featured${sub.plan === "pro" ? " is-current" : ""}`}>
          <header>
            <p className="pricing-card__badge">Most popular</p>
            <h2>Pro</h2>
            <p className="pricing-card__price">
              <strong>{proPrice}</strong>
              <small>/ month{billing === "yearly" ? ", billed yearly" : ""}</small>
            </p>
            <p className="pricing-card__lede">Everything in Free plus the power tools.</p>
          </header>
          <ul>
            <li>✓ All free tools, no ads</li>
            <li>✓ Watermark (text & logo)</li>
            <li>✓ Images → PDF</li>
            <li>✓ Background remover <small>(beta)</small></li>
            <li>✓ Batch rename templates</li>
            <li>✓ Unlimited batches</li>
            <li>✓ 1 GB per file</li>
            <li>✓ Up to 20,000×20,000 px</li>
            <li>✓ Priority email support</li>
          </ul>
          {sub.plan === "pro" ? (
            <button type="button" className="btn btn--primary btn--block" disabled>
              Your current plan
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => {
                setPlan("pro");
                alert("Pro activated for this demo build. In production, this would launch checkout.");
              }}
            >
              {pro ? "Switch to Pro" : "Start free 7-day trial"}
            </button>
          )}
        </article>

        <article className={`pricing-card${sub.plan === "team" ? " is-current" : ""}`}>
          <header>
            <h2>Team</h2>
            <p className="pricing-card__price">
              <strong>{teamPrice}</strong>
              <small>/ user / month</small>
            </p>
            <p className="pricing-card__lede">For studios and small teams.</p>
          </header>
          <ul>
            <li>✓ Everything in Pro</li>
            <li>✓ Shared brand presets & watermarks</li>
            <li>✓ Conversion API (10k calls / mo)</li>
            <li>✓ SSO & centralized billing</li>
            <li>✓ 99.9% uptime SLA on API</li>
            <li>✓ Dedicated success manager</li>
          </ul>
          {sub.plan === "team" ? (
            <button type="button" className="btn btn--primary btn--block" disabled>
              Your current plan
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={() => {
                setPlan("team");
                alert("Team plan activated for this demo build.");
              }}
            >
              Contact sales
            </button>
          )}
        </article>
      </div>

      <section className="content-section">
        <h2>Compare plans</h2>
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Pro</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              <tr><th>HEIC, JPG, PNG, WebP conversion</th><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><th>Compress, resize, rotate</th><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><th>App Store screenshot resizer</th><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><th>EXIF viewer + strip</th><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><th>Color picker</th><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><th>Files per batch</th><td>20</td><td>Unlimited</td><td>Unlimited</td></tr>
              <tr><th>Max file size</th><td>50 MB</td><td>1 GB</td><td>1 GB</td></tr>
              <tr><th>Max resolution</th><td>6000 px</td><td>20000 px</td><td>20000 px</td></tr>
              <tr><th>Ads</th><td>Tasteful house ads</td><td>None</td><td>None</td></tr>
              <tr><th>Watermarks</th><td>—</td><td>✓</td><td>✓ + brand presets</td></tr>
              <tr><th>Images to PDF</th><td>—</td><td>✓</td><td>✓</td></tr>
              <tr><th>Background remover</th><td>—</td><td>✓</td><td>✓</td></tr>
              <tr><th>Batch rename templates</th><td>—</td><td>✓</td><td>✓</td></tr>
              <tr><th>Conversion API</th><td>—</td><td>—</td><td>10k / mo</td></tr>
              <tr><th>SSO & centralized billing</th><td>—</td><td>—</td><td>✓</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-section">
        <h2>Questions about pricing</h2>
        <div className="faq">
          <details>
            <summary>Can I cancel anytime?</summary>
            <p>Yes — cancel from your account dashboard and your plan stays Pro until the period ends.</p>
          </details>
          <details>
            <summary>Do you offer a student discount?</summary>
            <p>Yes — email <Link to="/contact">support</Link> from your .edu address for 50% off.</p>
          </details>
          <details>
            <summary>What payment methods do you accept?</summary>
            <p>Credit cards, Apple Pay, Google Pay. Team plans can also pay by invoice.</p>
          </details>
          <details>
            <summary>Is there a money-back guarantee?</summary>
            <p>30 days. Reach out and we'll refund, no questions asked.</p>
          </details>
        </div>
      </section>
    </div>
  );
}
