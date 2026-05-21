import { Link } from "../lib/router";
import { TOOLS } from "../lib/tools";
import { POSTS } from "./Blog";

export function Sitemap(): React.ReactElement {
  return (
    <div className="page-doc">
      <h1>Sitemap</h1>
      <section>
        <h2>Tools</h2>
        <ul>
          {TOOLS.map((t) => (
            <li key={t.slug}>
              <Link to={`/tool/${t.slug}`}>{t.name}</Link> — {t.short}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Pages</h2>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/pricing">Pricing</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/blog">Blog</Link></li>
          <li><Link to="/privacy">Privacy policy</Link></li>
          <li><Link to="/terms">Terms of service</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/account">Account</Link></li>
        </ul>
      </section>
      <section>
        <h2>Blog posts</h2>
        <ul>
          {POSTS.map((p) => (
            <li key={p.slug}>
              <Link to={`/blog/${p.slug}`}>{p.title}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
