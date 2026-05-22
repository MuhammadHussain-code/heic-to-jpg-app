export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export const FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const FORMAT_LABELS: Record<OutputFormat, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

export function baseNameWithoutExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isHeicFile(file: File): boolean {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "heic" || ext === "heif") return true;
  const t = file.type.toLowerCase();
  return (
    t === "image/heic" ||
    t === "image/heif" ||
    t === "image/heif-sequence" ||
    t === "image/heic-sequence"
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export async function readImageBitmap(file: File | Blob): Promise<ImageBitmap> {
  return await createImageBitmap(file);
}

/**
 * Encode a source bitmap to a chosen format, optionally resizing to a target
 * width × height (cover-fit + center crop), or applying a uniform scale.
 */
export async function encodeImage(
  bitmap: ImageBitmap,
  options: {
    format: OutputFormat;
    quality?: number;
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "stretch";
    background?: string;
    rotate?: 0 | 90 | 180 | 270;
    flipH?: boolean;
    flipV?: boolean;
  },
): Promise<Blob> {
  const {
    format,
    quality = 0.9,
    width,
    height,
    fit = "cover",
    background = "#ffffff",
    rotate = 0,
    flipH = false,
    flipV = false,
  } = options;

  const sourceW = bitmap.width;
  const sourceH = bitmap.height;

  // Apply rotation to determine effective source dimensions.
  const rotated = rotate === 90 || rotate === 270;
  const effectiveSrcW = rotated ? sourceH : sourceW;
  const effectiveSrcH = rotated ? sourceW : sourceH;

  const targetW = width ?? effectiveSrcW;
  const targetH = height ?? effectiveSrcH;

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  if (format === "image/jpeg") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, targetW, targetH);
  }

  // Compute draw rect based on fit mode (against the post-rotation orientation).
  let drawW: number;
  let drawH: number;
  if (fit === "stretch" || width === undefined || height === undefined) {
    drawW = targetW;
    drawH = targetH;
  } else if (fit === "cover") {
    const scale = Math.max(targetW / effectiveSrcW, targetH / effectiveSrcH);
    drawW = effectiveSrcW * scale;
    drawH = effectiveSrcH * scale;
  } else {
    const scale = Math.min(targetW / effectiveSrcW, targetH / effectiveSrcH);
    drawW = effectiveSrcW * scale;
    drawH = effectiveSrcH * scale;
  }
  ctx.save();
  ctx.translate(targetW / 2, targetH / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  // After rotation, draw with the un-rotated source dimensions.
  // We need to map the (drawX,drawY,drawW,drawH) rect in the output space
  // back through the rotation. The simplest: draw centered using the
  // post-rotation effective draw size, but compensate dimensions when rotated.
  const finalDrawW = rotated ? drawH : drawW;
  const finalDrawH = rotated ? drawW : drawH;
  ctx.drawImage(bitmap, -finalDrawW / 2, -finalDrawH / 2, finalDrawW, finalDrawH);
  ctx.restore();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, format, quality),
  );
  if (!blob) throw new Error("Image encode failed");
  return blob;
}

/** Read EXIF orientation from a JPEG to use as a hint. Returns 1 if not found. */
export async function readJpegOrientation(file: File | Blob): Promise<number> {
  const buf = await file.slice(0, 65536).arrayBuffer();
  const view = new DataView(buf);
  if (view.byteLength < 4) return 1;
  if (view.getUint16(0) !== 0xffd8) return 1;
  let offset = 2;
  while (offset < view.byteLength) {
    const marker = view.getUint16(offset);
    offset += 2;
    if (marker === 0xffe1) {
      const exifSize = view.getUint16(offset);
      const exifStart = offset + 2;
      if (view.getUint32(exifStart) !== 0x45786966) return 1;
      const tiffOffset = exifStart + 6;
      const little = view.getUint16(tiffOffset) === 0x4949;
      const get16 = (o: number) => view.getUint16(o, little);
      const get32 = (o: number) => view.getUint32(o, little);
      const firstIfdOffset = get32(tiffOffset + 4);
      const entries = get16(tiffOffset + firstIfdOffset);
      for (let i = 0; i < entries; i++) {
        const entryOffset = tiffOffset + firstIfdOffset + 2 + i * 12;
        if (entryOffset + 12 > view.byteLength) break;
        const tag = get16(entryOffset);
        if (tag === 0x0112) {
          return get16(entryOffset + 8);
        }
      }
      offset += exifSize;
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      const size = view.getUint16(offset);
      offset += size;
    }
  }
  return 1;
}

export type ExifSummary = {
  make?: string;
  model?: string;
  orientation?: number;
  dateTime?: string;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  width?: number;
  height?: number;
};

/** Lightweight EXIF reader for JPEGs — returns a few common tags. */
export async function readExif(file: File | Blob): Promise<ExifSummary | null> {
  const buf = await file.slice(0, 131072).arrayBuffer();
  const view = new DataView(buf);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset < view.byteLength) {
    const marker = view.getUint16(offset);
    offset += 2;
    if (marker === 0xffe1) {
      const size = view.getUint16(offset);
      const exifStart = offset + 2;
      if (view.getUint32(exifStart) !== 0x45786966) {
        offset += size;
        continue;
      }
      const tiff = exifStart + 6;
      const little = view.getUint16(tiff) === 0x4949;
      const get16 = (o: number) => view.getUint16(o, little);
      const get32 = (o: number) => view.getUint32(o, little);
      const result: ExifSummary = {};
      const readString = (o: number, len: number): string => {
        let s = "";
        for (let i = 0; i < len; i++) {
          const c = view.getUint8(o + i);
          if (c === 0) break;
          s += String.fromCharCode(c);
        }
        return s;
      };
      const readRational = (o: number): number => {
        const num = get32(o);
        const den = get32(o + 4);
        return den === 0 ? 0 : num / den;
      };
      const parseIfd = (ifdOffset: number) => {
        const entries = get16(tiff + ifdOffset);
        for (let i = 0; i < entries; i++) {
          const entry = tiff + ifdOffset + 2 + i * 12;
          if (entry + 12 > view.byteLength) break;
          const tag = get16(entry);
          const type = get16(entry + 2);
          const count = get32(entry + 4);
          const valOffset = entry + 8;
          const dataOffset =
            (type === 2 && count > 4) || (type === 5 && count >= 1) || (type === 3 && count > 2)
              ? tiff + get32(valOffset)
              : valOffset;
          switch (tag) {
            case 0x010f:
              result.make = readString(dataOffset, count).trim();
              break;
            case 0x0110:
              result.model = readString(dataOffset, count).trim();
              break;
            case 0x0112:
              result.orientation = get16(valOffset);
              break;
            case 0x0132:
              result.dateTime = readString(dataOffset, count).trim();
              break;
            case 0x829a:
              result.exposureTime = `${readRational(dataOffset).toFixed(4)}s`;
              break;
            case 0x829d:
              result.fNumber = readRational(dataOffset);
              break;
            case 0x8827:
              result.iso = get16(valOffset);
              break;
            case 0x920a:
              result.focalLength = readRational(dataOffset);
              break;
            case 0xa002:
              result.width = type === 3 ? get16(valOffset) : get32(valOffset);
              break;
            case 0xa003:
              result.height = type === 3 ? get16(valOffset) : get32(valOffset);
              break;
            case 0x8769: {
              const subIfd = get32(valOffset);
              if (subIfd > 0 && subIfd < view.byteLength) parseIfd(subIfd);
              break;
            }
          }
        }
      };
      const firstIfd = get32(tiff + 4);
      parseIfd(firstIfd);
      return result;
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      const size = view.getUint16(offset);
      offset += size;
    }
  }
  return null;
}
