import { Link } from "../lib/router";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  body: React.ReactNode;
};

export const POSTS: BlogPost[] = [
  {
    slug: "convert-heic-to-jpg-on-windows-and-mac",
    title: "How to convert HEIC to JPG on Windows, Mac, and the browser",
    excerpt:
      "AirDrop a photo to your PC and suddenly you can't open it. Here's why iPhones use HEIC, and three ways to convert it back to JPG.",
    date: "2026-04-12",
    readMinutes: 5,
    body: (
      <>
        <p>
          You took a photo on your iPhone, AirDropped it to your laptop, and now
          Windows Photos won't open it. The file ends in <code>.HEIC</code> and
          Windows shrugs.
        </p>
        <h2>Why iPhones use HEIC</h2>
        <p>
          Since iOS 11, iPhones save photos as <strong>HEIC</strong> (High
          Efficiency Image Container) by default. HEIC files are roughly half the
          size of a JPG at the same visual quality. That's great for storage but
          terrible for compatibility — Windows, Discord, most CMSes, and many
          older apps can't read it.
        </p>
        <h2>Option 1 — convert in the browser (recommended)</h2>
        <p>
          Use a tool that runs entirely client-side, like SnapForge's{" "}
          <Link to="/tool/heic-to-jpg">HEIC → JPG converter</Link>. Drop the file,
          download the JPG. Nothing leaves your computer.
        </p>
        <h2>Option 2 — change iPhone settings</h2>
        <p>
          Open <em>Settings → Camera → Formats</em> and pick <em>Most Compatible</em>.
          New photos will save as JPG; existing HEICs stay as HEIC.
        </p>
        <h2>Option 3 — install codecs (Windows 11)</h2>
        <p>
          Microsoft's HEIF Image Extension lets Windows Photos open HEICs natively,
          but the codec costs $0.99 and many apps still won't read the format.
        </p>
        <h2>Why we prefer the browser</h2>
        <p>
          Most online HEIC converters upload your photos to their servers. That's
          a privacy red flag — photos contain location data, faces, and
          context you probably don't want a third party to keep. SnapForge does
          the conversion locally in your browser using a WASM decoder, so the
          file never leaves your device.
        </p>
      </>
    ),
  },
  {
    slug: "jpg-png-webp-which-format-to-use",
    title: "JPG vs PNG vs WebP: which format should you use?",
    excerpt:
      "Quick rules of thumb for picking the right image format — and when to switch.",
    date: "2026-03-30",
    readMinutes: 4,
    body: (
      <>
        <p>
          Three formats cover 95% of the web: JPG, PNG, WebP. Here's a simple
          decision tree.
        </p>
        <h2>Use JPG for photos</h2>
        <p>
          JPG's lossy compression is built around how human eyes perceive light
          and color. For photographs, it produces the smallest file at the
          highest visual quality. Don't use JPG for logos or screenshots — the
          compression artifacts will be obvious around hard edges.
        </p>
        <h2>Use PNG for graphics with sharp edges or transparency</h2>
        <p>
          PNG is lossless and supports an alpha channel. Use it for logos, icons,
          screenshots, and anything with crisp edges. PNGs are usually larger
          than the JPG equivalent, so don't use them for photos.
        </p>
        <h2>Use WebP everywhere modern</h2>
        <p>
          WebP supports both lossy and lossless modes plus alpha. It's typically
          25–35% smaller than JPG and PNG at equivalent quality, and is
          supported in every modern browser. The main downside is that some
          legacy CMSes and email clients don't accept it.
        </p>
        <h2>Practical workflow</h2>
        <ol>
          <li>Take photos / make graphics in their native format.</li>
          <li>For web delivery: export WebP first, fall back to JPG.</li>
          <li>For email and legacy systems: JPG (photos) or PNG (graphics).</li>
        </ol>
        <p>
          SnapForge's <Link to="/tool/image-converter">Image Converter</Link>{" "}
          handles all three formats in either direction.
        </p>
      </>
    ),
  },
  {
    slug: "how-to-resize-app-store-screenshots",
    title: "App Store screenshot sizes (2026 update)",
    excerpt:
      "Apple's required screenshot dimensions — and the easiest way to produce them.",
    date: "2026-02-14",
    readMinutes: 3,
    body: (
      <>
        <p>
          Apple has been quietly adjusting screenshot requirements. As of 2026,
          the App Store accepts:
        </p>
        <ul>
          <li><strong>iPhone 6.9"</strong> — 1290 × 2796 portrait, 2796 × 1290 landscape</li>
          <li><strong>iPhone 6.7"</strong> — 1284 × 2778 portrait, 2778 × 1284 landscape</li>
          <li><strong>iPhone 6.5"</strong> — 1242 × 2688 portrait, 2688 × 1242 landscape</li>
          <li><strong>iPad 13"</strong> — 2064 × 2752 portrait, 2752 × 2064 landscape</li>
          <li><strong>iPad Pro 12.9"</strong> — 2048 × 2732 portrait, 2732 × 2048 landscape</li>
        </ul>
        <p>
          If you submit a screenshot in the wrong dimensions, App Store Connect
          rejects the upload silently. Our{" "}
          <Link to="/tool/screenshots">screenshot resizer</Link> includes every
          current preset and center-crops your image to fit.
        </p>
      </>
    ),
  },
  {
    slug: "strip-exif-before-sharing",
    title: "Why you should strip EXIF metadata before posting photos",
    excerpt:
      "Your phone embeds your GPS coordinates and camera model in every photo. Here's how to clean them out.",
    date: "2026-01-20",
    readMinutes: 4,
    body: (
      <>
        <p>
          When your iPhone or Android phone saves a photo, it embeds dozens of
          fields of metadata in the file — known as <strong>EXIF</strong> data.
          That includes:
        </p>
        <ul>
          <li>GPS latitude and longitude (often accurate to a few meters)</li>
          <li>Date and time the photo was taken</li>
          <li>Camera make and model, lens, exposure, ISO</li>
          <li>The phone's unique serial number (on some devices)</li>
        </ul>
        <p>
          Social networks usually strip this metadata when you upload, but file
          sharing services, forums, and email do not. If you've ever wondered how
          someone could find your home from a single photo, this is how.
        </p>
        <h2>The fix</h2>
        <p>
          Use our <Link to="/tool/exif">EXIF viewer</Link> to inspect what's
          embedded in a photo, then click "Strip metadata" to download a clean
          copy. The cleaned version has no EXIF, no GPS, no device IDs.
        </p>
      </>
    ),
  },
];

export function Blog(): React.ReactElement {
  return (
    <div className="page-blog">
      <header className="page-blog__head">
        <h1>The SnapForge blog</h1>
        <p>
          Guides, format explainers, and occasional rants about image
          compression.
        </p>
      </header>
      <ul className="post-list">
        {POSTS.map((post) => (
          <li key={post.slug}>
            <Link to={`/blog/${post.slug}`} className="post-card">
              <p className="post-card__meta">
                {new Date(post.date).toLocaleDateString()} · {post.readMinutes} min read
              </p>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <span className="post-card__more">Read article →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BlogPost({ slug }: { slug: string }): React.ReactElement {
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) {
    return (
      <div className="page-doc">
        <h1>Post not found</h1>
        <p>
          That post doesn't exist. <Link to="/blog">Back to all posts</Link>.
        </p>
      </div>
    );
  }
  const related = POSTS.filter((p) => p.slug !== slug).slice(0, 3);
  return (
    <article className="page-post">
      <nav className="breadcrumbs">
        <Link to="/">Home</Link>
        <span aria-hidden> / </span>
        <Link to="/blog">Blog</Link>
        <span aria-hidden> / </span>
        <span aria-current="page">{post.title}</span>
      </nav>
      <header>
        <p className="muted">
          {new Date(post.date).toLocaleDateString()} · {post.readMinutes} min read
        </p>
        <h1>{post.title}</h1>
      </header>
      <div className="page-post__body">{post.body}</div>
      <footer className="page-post__foot">
        <h3>Related posts</h3>
        <ul className="post-list post-list--compact">
          {related.map((p) => (
            <li key={p.slug}>
              <Link to={`/blog/${p.slug}`}>
                <strong>{p.title}</strong>
                <small>{p.excerpt}</small>
              </Link>
            </li>
          ))}
        </ul>
      </footer>
    </article>
  );
}
