/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADSENSE_SLOT_INLINE?: string;
  readonly VITE_ADSENSE_SLOT_RECTANGLE?: string;
  readonly VITE_ADSENSE_SLOT_LEADERBOARD?: string;
  readonly VITE_ADSENSE_SLOT_SQUARE?: string;
  readonly VITE_ADSENSE_SLOT_SKYSCRAPER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
