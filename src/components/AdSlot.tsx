import { useEffect, useState } from "react";
import { isPro, useSubscription } from "../lib/subscription";
import { Link } from "../lib/router";
import { ADSENSE_CLIENT, ADSENSE_SLOTS, type AdSize } from "../lib/ads";

const DIMENSIONS: Record<AdSize, { w: number; h: number; label: string }> = {
  leaderboard: { w: 728, h: 90, label: "728×90" },
  rectangle: { w: 300, h: 250, label: "300×250" },
  square: { w: 250, h: 250, label: "250×250" },
  skyscraper: { w: 160, h: 600, label: "160×600" },
  inline: { w: 0, h: 0, label: "Responsive" },
};

const HOUSE_ADS = [
  {
    title: "Go Pro — remove all ads",
    body: "Unlimited batches, larger files, watermark & PDF tools.",
    cta: "See Pro plans",
    to: "/pricing",
  },
  {
    title: "Tip: convert in bulk",
    body: "Drop a whole folder at once and download a ZIP of the results.",
    cta: "Try bulk convert",
    to: "/tool/image-converter",
  },
  {
    title: "Watermark every export",
    body: "Pro lets you stamp a logo or text on every image in a batch.",
    cta: "Learn more",
    to: "/tool/watermark",
  },
  {
    title: "Privacy by default",
    body: "Every conversion runs locally — your files never touch our servers.",
    cta: "How it works",
    to: "/about",
  },
];

export function AdSlot({
  size = "rectangle",
  label = "Sponsored",
}: {
  size?: AdSize;
  label?: string;
}): React.ReactElement | null {
  const sub = useSubscription();
  const [adIndex] = useState(() => Math.floor(Math.random() * HOUSE_ADS.length));

  if (isPro(sub)) return null;

  const dim = DIMENSIONS[size];
  const ad = HOUSE_ADS[adIndex];

  return (
    <aside
      className={`ad-slot ad-slot--${size}`}
      style={
        size !== "inline"
          ? { maxWidth: `${dim.w}px`, minHeight: `${dim.h}px` }
          : undefined
      }
      aria-label="Advertisement"
    >
      <div className="ad-slot__label">
        <span>{label}</span>
        <Link to="/pricing" className="ad-slot__remove">
          Remove ads →
        </Link>
      </div>
      <Link to={ad.to} className="ad-slot__body">
        <strong>{ad.title}</strong>
        <span>{ad.body}</span>
        <span className="ad-slot__cta">{ad.cta}</span>
      </Link>
    </aside>
  );
}

/**
 * Renders a real AdSense ad unit if a slot ID is configured for this size
 * via VITE_ADSENSE_SLOT_* env vars; otherwise falls back to the rotating
 * house ad. Pro/Team users see nothing either way.
 */
export function NetworkAdSlot({
  size = "rectangle",
}: {
  size?: AdSize;
}): React.ReactElement | null {
  const sub = useSubscription();
  const slotId = ADSENSE_SLOTS[size];

  useEffect(() => {
    if (!slotId || isPro(sub)) return;
    try {
      // @ts-expect-error AdSense pushes onto the global queue.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore — common in dev or when adsbygoogle.js is blocked.
    }
  }, [slotId, sub]);

  if (isPro(sub)) return null;
  if (!slotId) return <AdSlot size={size} />;

  return (
    <ins
      className={`adsbygoogle ad-slot ad-slot--${size}`}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
