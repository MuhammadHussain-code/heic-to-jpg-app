export function Terms(): React.ReactElement {
  return (
    <div className="page-doc">
      <h1>Terms of service</h1>
      <p className="muted">Last updated: 2026-01-01</p>

      <section>
        <h2>Acceptable use</h2>
        <p>
          Use SnapForge for any lawful purpose. Don't use it to process content
          that is illegal in your jurisdiction or that you don't have the right to
          process.
        </p>
      </section>

      <section>
        <h2>Service availability</h2>
        <p>
          We aim for high availability but don't guarantee uninterrupted service
          on the Free plan. Team plans include a 99.9% uptime SLA on the API.
        </p>
      </section>

      <section>
        <h2>Pro & Team subscriptions</h2>
        <p>
          Subscriptions auto-renew until you cancel. Cancel from your account
          dashboard. We offer a 30-day money-back guarantee on first purchases.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          SnapForge is provided "as is". We're not liable for data loss, file
          corruption, or business interruption resulting from use of the service.
          Always keep backups of your originals.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms occasionally. Material changes will be
          announced via email to Pro and Team subscribers.
        </p>
      </section>
    </div>
  );
}
