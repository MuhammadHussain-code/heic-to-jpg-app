// AdSense configuration. The publisher ID is public (it's printed in
// ads.txt and the script tag) so it's safe to commit; slot IDs are
// pulled from build-time env vars so we can change them per environment
// without redeploying code.
//
// Set the slot IDs in Netlify → Site settings → Environment variables.
// Anything left unset will fall back to a rotating house ad so the
// layout never looks broken.

export type AdSize =
  | "leaderboard"
  | "rectangle"
  | "square"
  | "skyscraper"
  | "inline";

export const ADSENSE_CLIENT = "ca-pub-1593381421465566";

export const ADSENSE_SLOTS: Record<AdSize, string | undefined> = {
  inline: import.meta.env.VITE_ADSENSE_SLOT_INLINE,
  rectangle: import.meta.env.VITE_ADSENSE_SLOT_RECTANGLE,
  leaderboard: import.meta.env.VITE_ADSENSE_SLOT_LEADERBOARD,
  square: import.meta.env.VITE_ADSENSE_SLOT_SQUARE,
  skyscraper: import.meta.env.VITE_ADSENSE_SLOT_SKYSCRAPER,
};
