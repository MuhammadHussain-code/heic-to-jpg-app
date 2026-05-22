import { NetworkAdSlot } from "./AdSlot";
import { Link } from "../lib/router";
import { TOOLS, type ToolMeta } from "../lib/tools";

export function ToolLayout({
  tool,
  faqs,
  howTo,
  children,
}: {
  tool: ToolMeta;
  faqs?: Array<{ q: string; a: string }>;
  howTo?: string[];
  children: React.ReactNode;
}): React.ReactElement {
  const related = TOOLS.filter(
    (t) => t.slug !== tool.slug && t.category === tool.category,
  ).slice(0, 4);

  return (
    <div className="tool-layout">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden> / </span>
        <Link to="/#tools">Tools</Link>
        <span aria-hidden> / </span>
        <span aria-current="page">{tool.name}</span>
      </nav>

      <div className="tool-layout__head">
        <h1>{tool.name}</h1>
        <p>{tool.description}</p>
      </div>

      <div className="tool-layout__grid">
        <main className="tool-layout__main">
          {children}

          {howTo && howTo.length > 0 && (
            <section className="content-section">
              <h2>How to use the {tool.name} tool</h2>
              <ol className="howto-list">
                {howTo.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
          )}

          <NetworkAdSlot size="inline" />

          {faqs && faqs.length > 0 && (
            <section className="content-section">
              <h2>Frequently asked questions</h2>
              <div className="faq">
                {faqs.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="tool-layout__side">
          <NetworkAdSlot size="rectangle" />
          {related.length > 0 && (
            <div className="related-card">
              <h3>Related tools</h3>
              <ul>
                {related.map((t) => (
                  <li key={t.slug}>
                    <Link to={`/tool/${t.slug}`}>
                      <span className="related-card__icon">{t.icon}</span>
                      <span>
                        <strong>{t.name}</strong>
                        <small>{t.short}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <NetworkAdSlot size="square" />
        </aside>
      </div>
    </div>
  );
}
