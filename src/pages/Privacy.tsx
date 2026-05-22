export function Privacy(): React.ReactElement {
  return (
    <div className="page-doc">
      <h1>Privacy policy</h1>
      <p className="muted">Last updated: 2026-01-01</p>

      <section>
        <h2>Short version</h2>
        <ul>
          <li>We don't upload your images. All conversion happens in your browser.</li>
          <li>We do not store, log, or analyze the contents of your files.</li>
          <li>We collect anonymous usage analytics (page views, button clicks).</li>
          <li>We display ads on the free tier. Pro removes them entirely.</li>
        </ul>
      </section>

      <section>
        <h2>What we collect</h2>
        <p>
          When you visit SnapForge, our analytics provider records the page you
          visited, your browser type, and your approximate country. We do not
          fingerprint you, and we do not use cross-site cookies.
        </p>
        <p>
          If you create a Pro account, we collect your email address, billing
          information (handled by Stripe — we never see your card number), and a
          record of your plan.
        </p>
      </section>

      <section>
        <h2>What we don't collect</h2>
        <p>
          We never see your images. SnapForge has no upload endpoint. You can
          verify this in your browser's developer tools.
        </p>
      </section>

      <section>
        <h2>Ads</h2>
        <p>
          The free tier shows contextual ads. Our ad partners may set their own
          cookies; you can opt out from your browser's privacy settings or by
          upgrading to Pro, which removes all advertising.
        </p>
      </section>

      <section>
        <h2>Local storage</h2>
        <p>
          We store a small amount of data locally in your browser: your selected
          plan, conversion history (just filenames and sizes), and your
          preferences. None of this leaves your device. Clear it from your browser
          settings at any time.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Under GDPR and CCPA, you have the right to access, correct, and delete
          any personal data we hold. Email{" "}
          <a href="mailto:privacy@snapforge.example">privacy@snapforge.example</a>{" "}
          and we'll respond within 30 days.
        </p>
      </section>
    </div>
  );
}
