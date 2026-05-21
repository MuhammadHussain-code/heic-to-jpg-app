import { useEffect } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Pricing } from "./pages/Pricing";
import { About } from "./pages/About";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Contact } from "./pages/Contact";
import { Account } from "./pages/Account";
import { Blog, BlogPost, POSTS } from "./pages/Blog";
import { Sitemap } from "./pages/Sitemap";
import { Tool } from "./pages/Tool";
import { NotFound } from "./pages/NotFound";
import { findTool } from "./lib/tools";
import { useRoute } from "./lib/router";

const TITLE_BASE = "SnapForge — private, in-browser image tools";

function useDocumentTitle(route: ReturnType<typeof useRoute>): void {
  useEffect(() => {
    const { path } = route;
    if (path === "/") {
      document.title = TITLE_BASE;
    } else if (path === "/pricing") {
      document.title = "Pricing — SnapForge";
    } else if (path === "/about") {
      document.title = "About SnapForge";
    } else if (path === "/privacy") {
      document.title = "Privacy policy — SnapForge";
    } else if (path === "/terms") {
      document.title = "Terms — SnapForge";
    } else if (path === "/contact") {
      document.title = "Contact — SnapForge";
    } else if (path === "/account") {
      document.title = "Account — SnapForge";
    } else if (path === "/blog") {
      document.title = "Blog — SnapForge";
    } else if (path.startsWith("/blog/")) {
      const slug = path.slice("/blog/".length);
      const post = POSTS.find((p) => p.slug === slug);
      document.title = post ? `${post.title} — SnapForge` : "Blog — SnapForge";
    } else if (path.startsWith("/tool/")) {
      const slug = path.slice("/tool/".length);
      const tool = findTool(slug);
      document.title = tool ? `${tool.name} — SnapForge` : "Tool — SnapForge";
    } else if (path === "/sitemap") {
      document.title = "Sitemap — SnapForge";
    } else {
      document.title = "Page not found — SnapForge";
    }
  }, [route]);
}

function renderRoute(path: string): React.ReactElement {
  if (path === "/") return <Home />;
  if (path === "/pricing") return <Pricing />;
  if (path === "/about") return <About />;
  if (path === "/privacy") return <Privacy />;
  if (path === "/terms") return <Terms />;
  if (path === "/contact") return <Contact />;
  if (path === "/account") return <Account />;
  if (path === "/sitemap") return <Sitemap />;
  if (path === "/blog") return <Blog />;
  if (path.startsWith("/blog/")) {
    return <BlogPost slug={path.slice("/blog/".length)} />;
  }
  if (path.startsWith("/tool/")) {
    return <Tool slug={path.slice("/tool/".length)} />;
  }
  return <NotFound />;
}

export function App(): React.ReactElement {
  const route = useRoute();
  useDocumentTitle(route);

  return (
    <div className="site-shell">
      <Header />
      <main className="site-main">{renderRoute(route.path)}</main>
      <Footer />
    </div>
  );
}
