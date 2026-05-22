// The form itself is hydrated by MailerLite's universal.js, loaded from
// index.html. Anywhere on the page that contains a div with class
// "ml-embedded" and the matching data-form key (cbmNHz) will be replaced
// with the configured signup form. We render that div inside our own
// card so the surrounding copy (headline, subhead, legal) stays in our
// design system; the form input + button come from MailerLite.
//
// To swap forms in MailerLite, update the data-form value here and the
// ml('account', ...) call in index.html.

const MAILERLITE_FORM_ID = "cbmNHz";

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
      <div className="ml-embedded" data-form={MAILERLITE_FORM_ID} />
      <p className="waitlist__legal">
        Unsubscribe anytime. We'll never share your email or send more than one
        update per month.
      </p>
    </div>
  );
}
