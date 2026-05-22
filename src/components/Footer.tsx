import { Link } from "../lib/router";
import { CATEGORIES, TOOLS } from "../lib/tools";

export function Footer(): React.ReactElement {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link to="/" className="brand">
            <span className="brand__mark" aria-hidden>◆</span>
            <span className="brand__name">SnapForge</span>
          </Link>
          <p className="site-footer__tagline">
            Fast, private image tools that run entirely in your browser.
          </p>
        </div>

        {CATEGORIES.map((cat) => {
          const tools = TOOLS.filter((t) => t.category === cat.id);
          if (tools.length === 0) return null;
          return (
            <div key={cat.id} className="site-footer__col">
              <h3>{cat.label}</h3>
              <ul>
                {tools.map((tool) => (
                  <li key={tool.slug}>
                    <Link to={`/tool/${tool.slug}`}>
                      {tool.name}
                      {tool.pro && <span className="pill">Pro</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <div className="site-footer__col">
          <h3>Company</h3>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© {year} SnapForge — all processing happens locally on your device.</span>
        <span className="site-footer__links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/sitemap">Sitemap</Link>
        </span>
      </div>
    </footer>
  );
}
