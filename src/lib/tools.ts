export type ToolMeta = {
  slug: string;
  name: string;
  short: string;
  description: string;
  category: "convert" | "edit" | "optimize" | "advanced";
  pro?: boolean;
  comingSoon?: boolean;
  icon: string;
  keywords: string[];
};

export const TOOLS: ToolMeta[] = [
  {
    slug: "heic-to-jpg",
    name: "HEIC to JPG",
    short: "Convert iPhone HEIC photos to JPG",
    description:
      "Drop iPhone HEIC or HEIF files and download them as universally-supported JPG images. Runs entirely in your browser — your photos never leave your device.",
    category: "convert",
    icon: "H→J",
    keywords: ["heic", "heif", "iphone", "jpg", "jpeg", "convert"],
  },
  {
    slug: "image-converter",
    name: "Image Converter",
    short: "JPG, PNG, WebP — any direction",
    description:
      "Convert between JPG, PNG, and WebP in either direction with adjustable quality. Useful for shrinking pages, supporting older browsers, or normalizing assets.",
    category: "convert",
    icon: "⇄",
    keywords: ["jpg", "png", "webp", "converter", "format"],
  },
  {
    slug: "compress",
    name: "Compress Images",
    short: "Shrink file size, keep quality",
    description:
      "Drag in JPGs or PNGs and pick a quality level. See the before/after size for every image and download the optimized result.",
    category: "optimize",
    icon: "↓",
    keywords: ["compress", "optimize", "shrink", "jpg", "png"],
  },
  {
    slug: "resize",
    name: "Resize Images",
    short: "By pixels or percentage",
    description:
      "Resize one image or a whole batch to a target width, height, or percentage. Pick between cover-fit (crop), contain (fit), or stretch.",
    category: "edit",
    icon: "⤢",
    keywords: ["resize", "scale", "dimensions"],
  },
  {
    slug: "rotate",
    name: "Rotate & Flip",
    short: "90° rotations and mirror flips",
    description:
      "Quickly rotate by 90°, 180°, or 270°, or flip horizontally / vertically. Output as JPG, PNG, or WebP.",
    category: "edit",
    icon: "↻",
    keywords: ["rotate", "flip", "mirror"],
  },
  {
    slug: "screenshots",
    name: "App Store Screenshots",
    short: "Exact iPhone & iPad sizes",
    description:
      "Resize and crop to the exact pixel dimensions required by Apple's App Store screenshot guidelines. iPhone 6.7\", 6.5\", 6.1\" and iPad Pro covered.",
    category: "edit",
    icon: "📱",
    keywords: ["app store", "screenshot", "iphone", "ipad"],
  },
  {
    slug: "exif",
    name: "EXIF Viewer",
    short: "Inspect & strip metadata",
    description:
      "See the camera, lens, exposure, and GPS metadata embedded in your JPEGs — and download a clean copy with all metadata removed.",
    category: "advanced",
    icon: "ⓘ",
    keywords: ["exif", "metadata", "privacy", "strip"],
  },
  {
    slug: "color-picker",
    name: "Color Picker",
    short: "Pick HEX/RGB from any image",
    description:
      "Drop an image and click anywhere to read the exact pixel color as HEX and RGB. Useful for matching brand palettes or extracting accents.",
    category: "advanced",
    icon: "🎨",
    keywords: ["color", "picker", "hex", "rgb", "palette"],
  },
  {
    slug: "watermark",
    name: "Add Watermark",
    short: "Text or image watermark",
    description:
      "Stamp every image in a batch with a text or logo watermark. Configure opacity, position, and size.",
    category: "edit",
    pro: true,
    icon: "©",
    keywords: ["watermark", "logo", "stamp", "branding"],
  },
  {
    slug: "image-to-pdf",
    name: "Images to PDF",
    short: "Combine into a single PDF",
    description:
      "Combine multiple images into one PDF, choosing page size and orientation. Useful for assembling proofs or contact sheets.",
    category: "convert",
    pro: true,
    icon: "📄",
    keywords: ["pdf", "combine", "merge"],
  },
  {
    slug: "background-remover",
    name: "Background Remover",
    short: "AI-powered cutouts",
    description:
      "Isolate the subject of a photo and download a transparent PNG. Powered by an on-device segmentation model — no upload required.",
    category: "advanced",
    pro: true,
    comingSoon: true,
    icon: "✂",
    keywords: ["background", "remove", "cutout", "transparent"],
  },
  {
    slug: "batch-rename",
    name: "Batch Rename",
    short: "Sequential & template renames",
    description:
      "Rename batches of converted files using sequential numbering or simple templates ({name}, {date}, {n}).",
    category: "advanced",
    pro: true,
    comingSoon: true,
    icon: "✎",
    keywords: ["rename", "batch", "template"],
  },
];

export function findTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export const CATEGORIES: Array<{ id: ToolMeta["category"]; label: string }> = [
  { id: "convert", label: "Convert" },
  { id: "optimize", label: "Optimize" },
  { id: "edit", label: "Edit" },
  { id: "advanced", label: "Advanced" },
];
