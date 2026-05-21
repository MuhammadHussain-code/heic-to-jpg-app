import { ToolLayout } from "../components/ToolLayout";
import { ProGate } from "../components/ProGate";
import { Link } from "../lib/router";
import { findTool } from "../lib/tools";
import { HeicToJpg } from "../tools/HeicToJpg";
import { ImageConverter } from "../tools/ImageConverter";
import { ImageCompressor } from "../tools/ImageCompressor";
import { ImageResizer } from "../tools/ImageResizer";
import { ImageRotator } from "../tools/ImageRotator";
import { ScreenshotResizer } from "../tools/ScreenshotResizer";
import { ExifViewer } from "../tools/ExifViewer";
import { ColorPicker } from "../tools/ColorPicker";
import { WatermarkTool } from "../tools/WatermarkTool";
import { ImageToPdf } from "../tools/ImageToPdf";

const TOOL_CONTENT: Record<
  string,
  {
    howTo: string[];
    faqs: Array<{ q: string; a: string }>;
  }
> = {
  "heic-to-jpg": {
    howTo: [
      "Drag your iPhone HEIC photos into the drop zone, or click to browse.",
      "Pick a quality level — Balanced (88%) is a good default.",
      "Click Download to grab a single file, or Download all as ZIP for the whole batch.",
    ],
    faqs: [
      {
        q: "What's the difference between HEIC and JPG?",
        a: "HEIC is a newer container format that produces roughly half the file size of JPG at the same visual quality. The trade-off is compatibility: most non-Apple software still can't open HEICs.",
      },
      {
        q: "Will I lose quality?",
        a: "JPG is lossy, so there's always a small re-encode loss. At Balanced (88%) the difference is invisible at normal viewing sizes. Use High (95%) for archival copies.",
      },
      {
        q: "Are my photos uploaded?",
        a: "No. The HEIC decoder runs inside your browser via WebAssembly. Your photos never leave your device.",
      },
      {
        q: "Can I convert HEIC to PNG instead?",
        a: "Yes — use the Image Converter tool, which supports HEIC → PNG and HEIC → WebP.",
      },
    ],
  },
  "image-converter": {
    howTo: [
      "Pick your target format: JPG, PNG, or WebP.",
      "Adjust quality if you're targeting JPG or WebP.",
      "Drop in any combination of JPG, PNG, WebP, or HEIC files.",
      "Download individually or grab the whole batch as a ZIP.",
    ],
    faqs: [
      {
        q: "Which format should I use for the web?",
        a: "WebP is smaller and broadly supported. JPG is the safest bet for legacy systems and email. PNG is best when you need transparency or perfectly sharp edges.",
      },
      {
        q: "Is WebP supported everywhere?",
        a: "All modern browsers support WebP. Some older CMSes and email clients still don't, so test before bulk-converting.",
      },
      {
        q: "What about AVIF?",
        a: "AVIF is on the roadmap and will land soon. It produces smaller files than WebP but encoding is slower.",
      },
    ],
  },
  compress: {
    howTo: [
      "Set the target quality. 70–85% is the sweet spot for photos.",
      "Drop your JPGs, PNGs, or WebPs into the drop zone.",
      "Watch the before/after size and savings percentage.",
      "Download compressed copies individually or in a ZIP.",
    ],
    faqs: [
      {
        q: "Why is my PNG not getting smaller?",
        a: "PNG is lossless — there's no quality dial. To shrink PNGs further, convert them to WebP (lossless) or, for photos, to JPG.",
      },
      {
        q: "Is the original modified?",
        a: "Never. SnapForge always writes a new file with -compressed appended to the name.",
      },
    ],
  },
  resize: {
    howTo: [
      "Choose Pixels (for exact dimensions) or Percent (to scale uniformly).",
      "Optionally lock the aspect ratio so the image isn't distorted.",
      "Pick an output format and drop your images in.",
    ],
    faqs: [
      {
        q: "What's the difference between cover, contain, and stretch?",
        a: "Cover fills the entire output and crops the edges. Contain fits the whole image inside the output (may leave background). Stretch distorts the image to fill exactly.",
      },
      {
        q: "How big can I go?",
        a: "Free plan: up to 6000 px wide. Pro: up to 20000 px wide.",
      },
    ],
  },
  rotate: {
    howTo: [
      "Pick a rotation angle (or 0° if you only want to flip).",
      "Tick Flip horizontal / vertical as needed.",
      "Drop your images and download the result.",
    ],
    faqs: [
      {
        q: "Why is my photo sideways even after I rotate it?",
        a: "Some photos have an EXIF orientation flag. SnapForge respects that flag, but if you also flip vertically, results may surprise — disable flipping and try again.",
      },
    ],
  },
  screenshots: {
    howTo: [
      "Pick the exact App Store dimensions you need.",
      "Drop your screenshots (PNG, JPG, or HEIC).",
      "Each image is center-cropped to fit the chosen size.",
      "Download as JPG — Apple accepts both PNG and JPG.",
    ],
    faqs: [
      {
        q: "Which dimensions does Apple actually require?",
        a: "Apple requires you to upload at least one of each: 6.7\", 6.5\", iPad 13\", and iPad Pro 12.9\" — though if your screenshots are identical across iPhone sizes, you only need to upload the largest.",
      },
      {
        q: "Can I upload PNG screenshots?",
        a: "Yes. We export JPG by default since it's smaller, but the App Store accepts both. Use the Image Converter to switch to PNG.",
      },
    ],
  },
  exif: {
    howTo: [
      "Drop a single JPG or PNG into the drop zone.",
      "Inspect the embedded EXIF metadata: camera, exposure, GPS, and more.",
      'Click "Strip metadata" to download a clean copy with no embedded data.',
    ],
    faqs: [
      {
        q: "Does stripping EXIF change the image quality?",
        a: "We re-encode at 95% quality. The visual difference is imperceptible, but the file is now metadata-free.",
      },
      {
        q: "Does this also strip GPS?",
        a: "Yes. GPS is part of EXIF — when we strip metadata, your location is removed.",
      },
    ],
  },
  "color-picker": {
    howTo: [
      "Drop any image into the picker.",
      "Click anywhere on the image to read the pixel color.",
      "Copy the HEX or RGB value to your clipboard.",
    ],
    faqs: [
      {
        q: "Can I pick from a screenshot?",
        a: "Yes — drop a screenshot or any web image.",
      },
      {
        q: "Why is the canvas smaller than my image?",
        a: "We scale images down to 720 px wide for performance, but the picked colors are sampled from the original pixel data.",
      },
    ],
  },
  watermark: {
    howTo: [
      "Type your watermark text — your name, URL, or a copyright string.",
      "Pick a position and dial in opacity and size.",
      "Drop in a batch of images and download the watermarked versions.",
    ],
    faqs: [
      {
        q: "Can I use a logo file instead of text?",
        a: "Logo watermarks are on the Pro roadmap. For now, text watermarks are supported.",
      },
      {
        q: "Will the watermark show on every image?",
        a: "Yes — your watermark settings are applied to every file in the batch.",
      },
    ],
  },
  "image-to-pdf": {
    howTo: [
      "Drop images into the tool — they become PDF pages in the order shown.",
      "Reorder pages with the ↑ / ↓ buttons, or remove any image.",
      "Pick a page size: Letter, A4, or Fit-to-image.",
      "Click Build PDF to download the result.",
    ],
    faqs: [
      {
        q: "Are images recompressed?",
        a: "JPGs are embedded directly with zero re-encode loss. PNGs and WebPs are re-encoded to JPG inside the PDF for size.",
      },
      {
        q: "Is there a page limit?",
        a: "Practically, browsers handle a few hundred pages comfortably. For thousands of pages, use a desktop tool.",
      },
    ],
  },
  "background-remover": { howTo: [], faqs: [] },
  "batch-rename": { howTo: [], faqs: [] },
};

function renderTool(slug: string): React.ReactNode {
  switch (slug) {
    case "heic-to-jpg":
      return <HeicToJpg />;
    case "image-converter":
      return <ImageConverter />;
    case "compress":
      return <ImageCompressor />;
    case "resize":
      return <ImageResizer />;
    case "rotate":
      return <ImageRotator />;
    case "screenshots":
      return <ScreenshotResizer />;
    case "exif":
      return <ExifViewer />;
    case "color-picker":
      return <ColorPicker />;
    case "watermark":
      return (
        <ProGate
          title="Watermark is a Pro feature"
          reason="Pro unlocks watermarking, batch limits, and the rest of the power tools."
          features={[
            "Text watermarks on every image in a batch",
            "Configurable opacity, position, and size",
            "Logo watermarks (coming soon)",
            "Brand presets (Team plan)",
          ]}
        >
          <WatermarkTool />
        </ProGate>
      );
    case "image-to-pdf":
      return (
        <ProGate
          title="Images → PDF is a Pro feature"
          reason="Combine multiple images into a single PDF for proofs, sheets, and quick share-outs."
          features={[
            "Letter, A4, or fit-to-image pages",
            "Reorder pages with drag controls",
            "Embed JPEGs without re-encoding loss",
            "Unlimited pages",
          ]}
        >
          <ImageToPdf />
        </ProGate>
      );
    case "background-remover":
      return (
        <div className="coming-soon">
          <h2>Background remover</h2>
          <p>
            An on-device segmentation model that isolates the subject and gives
            you a transparent PNG. Coming this quarter — Pro will get early
            access.
          </p>
          <Link to="/pricing" className="btn btn--primary">
            See Pro plans
          </Link>
        </div>
      );
    case "batch-rename":
      return (
        <div className="coming-soon">
          <h2>Batch rename</h2>
          <p>
            Templates like <code>{"{name}-{date}-{n}"}</code> applied across a
            batch. Shipping soon for Pro users.
          </p>
          <Link to="/pricing" className="btn btn--primary">
            See Pro plans
          </Link>
        </div>
      );
    default:
      return null;
  }
}

export function Tool({ slug }: { slug: string }): React.ReactElement {
  const tool = findTool(slug);
  if (!tool) {
    return (
      <div className="page-doc">
        <h1>Tool not found</h1>
        <p>
          That tool doesn't exist. <Link to="/">Back home</Link>.
        </p>
      </div>
    );
  }
  const content = TOOL_CONTENT[slug];
  return (
    <ToolLayout tool={tool} howTo={content?.howTo} faqs={content?.faqs}>
      {renderTool(slug)}
    </ToolLayout>
  );
}
