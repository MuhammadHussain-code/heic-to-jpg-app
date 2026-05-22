import { NetworkAdSlot } from "../components/AdSlot";
import { Link } from "../lib/router";
import { CATEGORIES, TOOLS } from "../lib/tools";
import { useUsageStats } from "../lib/usage";
import { formatBytes } from "../lib/image";

export function Home(): React.ReactElement {
  const stats = useUsageStats();
  return (
    <div className="page-home">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">Private image tools · 100% in-browser</p>
          <h1 className="hero__title">
            Convert, compress, resize.
            <br />
            <span className="hero__title-accent">Without uploading a single file.</span>
          </h1>
          <p className="hero__lede">
            SnapForge is a fast, ad-supported set of image utilities. Every conversion
            runs locally in your browser — your photos never touch our servers. Go Pro
            to remove ads and unlock larger batches, watermarks, and PDFs.
          </p>
          <div className="hero__cta">
            <Link to="/tool/heic-to-jpg" className="btn btn--primary btn--lg">
              Start with HEIC → JPG
            </Link>
            <Link to="/pricing" className="btn btn--ghost btn--lg">
              See Pro plans
            </Link>
          </div>
          <ul className="hero__bullets">
            <li>🔒 No uploads, ever</li>
            <li>⚡ Hardware-accelerated canvas pipeline</li>
            <li>📦 Bulk download as ZIP</li>
            <li>🆓 Free for personal use</li>
          </ul>
        </div>
        <NetworkAdSlot size="rectangle" />
      </section>

      {stats.totalConversions > 0 && (
        <section className="stats-strip">
          <div>
            <strong>{stats.totalConversions.toLocaleString()}</strong>
            <span>conversions on this device</span>
          </div>
          <div>
            <strong>{formatBytes(stats.bytesSaved)}</strong>
            <span>bandwidth saved</span>
          </div>
          <div>
            <strong>0</strong>
            <span>files uploaded</span>
          </div>
        </section>
      )}

      <section id="tools" className="tools-section">
        <h2>Pick a tool</h2>
        {CATEGORIES.map((cat) => {
          const tools = TOOLS.filter((t) => t.category === cat.id);
          if (tools.length === 0) return null;
          return (
            <div key={cat.id} className="tools-section__cat">
              <h3>{cat.label}</h3>
              <div className="tool-grid">
                {tools.map((tool) => (
                  <Link key={tool.slug} to={`/tool/${tool.slug}`} className="tool-card-link">
                    <div className="tool-card-link__icon">{tool.icon}</div>
                    <div className="tool-card-link__text">
                      <h4>
                        {tool.name}
                        {tool.pro && <span className="pill pill--pro">Pro</span>}
                        {tool.comingSoon && <span className="pill pill--soon">Soon</span>}
                      </h4>
                      <p>{tool.short}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <NetworkAdSlot size="leaderboard" />

      <section className="content-section">
        <h2>Why SnapForge?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Truly private</h3>
            <p>
              Most "free" converters silently upload your files. We don't. Everything
              runs in your browser's sandbox, on hardware-accelerated canvas APIs.
            </p>
          </div>
          <div className="feature-card">
            <h3>No installs</h3>
            <p>
              Drag, drop, download. Works on Mac, Windows, Linux, Chromebook, iPad —
              anywhere you have a modern browser.
            </p>
          </div>
          <div className="feature-card">
            <h3>Built for batches</h3>
            <p>
              Convert dozens of images at once and download them all as a single ZIP.
              Pro unlocks unlimited batches and 1 GB per file.
            </p>
          </div>
          <div className="feature-card">
            <h3>Designed for creators</h3>
            <p>
              Quality sliders, App Store screenshot presets, watermarks, EXIF cleanup
              — the everyday tools indie devs and designers actually need.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <h2>Frequently asked</h2>
        <div className="faq">
          <details open>
            <summary>Is SnapForge really free?</summary>
            <p>
              Yes. The core tools — HEIC to JPG, image conversion, compression,
              resizing, rotation — are free forever for personal use, supported by
              tasteful ads. Pro removes ads and unlocks watermarks, PDFs, larger
              batches, and bigger files.
            </p>
          </details>
          <details>
            <summary>Where are my files processed?</summary>
            <p>
              In your browser. SnapForge has no upload endpoint — open DevTools and
              check the Network tab during a conversion if you want to verify.
            </p>
          </details>
          <details>
            <summary>What formats are supported?</summary>
            <p>
              HEIC, HEIF, JPG, PNG, WebP for inputs. JPG, PNG, WebP, and PDF for
              outputs. AVIF input/output coming soon.
            </p>
          </details>
          <details>
            <summary>Is there a file size limit?</summary>
            <p>
              On the free plan, 50 MB per file and 20 files per batch. Pro raises
              these limits to 1 GB per file and unlimited batches.
            </p>
          </details>
          <details>
            <summary>Do you offer an API?</summary>
            <p>
              The Team plan includes an API for batch processing on your own
              servers, with no per-file charges. <Link to="/pricing">See pricing</Link>.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
