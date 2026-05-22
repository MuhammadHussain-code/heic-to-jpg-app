import { useState } from "react";

export function Contact(): React.ReactElement {
  const [sent, setSent] = useState(false);

  return (
    <div className="page-doc">
      <h1>Contact</h1>
      <p className="lede">
        Bug reports, feature requests, sales questions — we read everything.
      </p>

      {sent ? (
        <div className="success-card">
          <h2>Thanks!</h2>
          <p>We've got your message and will reply within one business day.</p>
        </div>
      ) : (
        <form
          className="contact-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label>
            <span>Your email</span>
            <input type="email" required placeholder="you@example.com" />
          </label>
          <label>
            <span>Topic</span>
            <select defaultValue="support">
              <option value="support">Support</option>
              <option value="sales">Sales (Team plans)</option>
              <option value="feedback">Feedback</option>
              <option value="bug">Bug report</option>
              <option value="privacy">Privacy</option>
            </select>
          </label>
          <label>
            <span>Message</span>
            <textarea rows={6} required placeholder="What can we help with?" />
          </label>
          <button type="submit" className="btn btn--primary">Send message</button>
        </form>
      )}

      <section>
        <h2>Direct emails</h2>
        <ul>
          <li>Support — <a href="mailto:support@muhammad-hussain.com">support@muhammad-hussain.com</a></li>
          <li>Sales — <a href="mailto:sales@muhammad-hussain.com">sales@muhammad-hussain.com</a></li>
          <li>Privacy — <a href="mailto:privacy@muhammad-hussain.com">privacy@muhammad-hussain.com</a></li>
          <li>Security — <a href="mailto:security@muhammad-hussain.com">security@muhammad-hussain.com</a></li>
        </ul>
      </section>
    </div>
  );
}
