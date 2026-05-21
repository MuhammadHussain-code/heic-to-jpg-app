import { useEffect, useState } from "react";
import { Link, navigate, useRoute } from "../lib/router";
import { isPro, useSubscription } from "../lib/subscription";
import { CATEGORIES, TOOLS } from "../lib/tools";

export function Header(): React.ReactElement {
  const route = useRoute();
  const sub = useSubscription();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const pro = isPro(sub);

  const closeAll = () => {
    setMenuOpen(false);
    setToolsOpen(false);
  };

  // Auto-close menus when the route changes (e.g. someone clicks a Link inside).
  useEffect(() => {
    setMenuOpen(false);
    setToolsOpen(false);
  }, [route.path]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand" onClick={closeAll}>
          <span className="brand__mark" aria-hidden>◆</span>
          <span className="brand__name">SnapForge</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span aria-hidden>☰</span>
        </button>

        <nav className={`site-nav${menuOpen ? " site-nav--open" : ""}`}>
          <div className="site-nav__group">
            <button
              type="button"
              className="site-nav__link site-nav__dropdown-toggle"
              aria-expanded={toolsOpen}
              onClick={() => setToolsOpen((v) => !v)}
            >
              Tools <span aria-hidden>▾</span>
            </button>
            {toolsOpen && (
              <div className="dropdown" role="menu">
                {CATEGORIES.map((cat) => {
                  const tools = TOOLS.filter((t) => t.category === cat.id);
                  if (tools.length === 0) return null;
                  return (
                    <div key={cat.id} className="dropdown__group">
                      <p className="dropdown__heading">{cat.label}</p>
                      <ul className="dropdown__list">
                        {tools.map((tool) => (
                          <li key={tool.slug}>
                            <a
                              href={`#/tool/${tool.slug}`}
                              className="dropdown__item"
                              role="menuitem"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/tool/${tool.slug}`);
                                closeAll();
                              }}
                            >
                              <span className="dropdown__icon">{tool.icon}</span>
                              <span className="dropdown__text">
                                <strong>{tool.name}</strong>
                                <small>{tool.short}</small>
                              </span>
                              {tool.pro && <span className="dropdown__pro">Pro</span>}
                              {tool.comingSoon && (
                                <span className="dropdown__soon">Soon</span>
                              )}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            to="/pricing"
            className={`site-nav__link${route.path === "/pricing" ? " is-active" : ""}`}
            onClick={closeAll}
          >
            Pricing
          </Link>
          <Link
            to="/blog"
            className={`site-nav__link${route.path.startsWith("/blog") ? " is-active" : ""}`}
            onClick={closeAll}
          >
            Blog
          </Link>
          <Link
            to="/about"
            className={`site-nav__link${route.path === "/about" ? " is-active" : ""}`}
            onClick={closeAll}
          >
            About
          </Link>

          {pro ? (
            <Link to="/account" className="site-nav__pro-badge" onClick={closeAll}>
              ★ {sub.plan === "team" ? "Team" : "Pro"}
            </Link>
          ) : (
            <Link to="/pricing" className="site-nav__cta" onClick={closeAll}>
              Get Pro
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
