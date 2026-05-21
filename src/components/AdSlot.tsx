import { useEffect, useState } from "react";
import { isPro, useSubscription } from "../lib/subscription";
import { Link } from "../lib/router";

type AdSize = "leaderboard" | "rectangle" | "square" | "skyscraper" | "inline";

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

  // Pro and Team users see no ads.
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
 * In a real deployment you'd wire AdSense / Carbon / EthicalAds here.
 * This component keeps an inline "house ad" until a network is configured,
 * so the layout is always realistic.
 */
export function NetworkAdSlot({ slot }: { slot: string }): React.ReactElement | null {
  const sub = useSubscription();
  const [adsenseId] = useState(() =>
    (window as unknown as { __ADSENSE_ID__?: string }).__ADSENSE_ID__,
  );

  useEffect(() => {
    if (!adsenseId || isPro(sub)) return;
    try {
      // @ts-expect-error AdSense pushes onto the global queue.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore initialization errors in dev
    }
  }, [adsenseId, sub]);

  if (isPro(sub)) return null;
  if (!adsenseId) return <AdSlot size="rectangle" label={`Ad · ${slot}`} />;
  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={adsenseId}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
