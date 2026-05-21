import { useState } from "react";
import { DropZone } from "../components/DropZone";
import { downloadBlob, formatBytes, readImageBitmap } from "../lib/image";

type PageSize = "letter" | "a4" | "fit";
type Orientation = "portrait" | "landscape";

const SIZES_PT: Record<Exclude<PageSize, "fit">, [number, number]> = {
  letter: [612, 792],
  a4: [595, 842],
};

type Item = {
  id: string;
  file: File;
};

/**
 * Build a multi-page PDF where each page hosts one JPEG. JPEGs are embedded
 * directly via the DCTDecode filter — no decoding/re-encoding cost.
 */
async function buildPdf(
  items: Item[],
  pageSize: PageSize,
  orientation: Orientation,
): Promise<Blob> {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let position = 0;
  const enc = new TextEncoder();
  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? enc.encode(data) : data;
    chunks.push(bytes);
    position += bytes.length;
  };
  const writeObj = (n: number, body: string) => {
    offsets[n] = position;
    push(`${n} 0 obj\n${body}\nendobj\n`);
  };

  push("%PDF-1.4\n%\xff\xff\xff\xff\n");

  // Object 1: catalog (placeholder until we know pages object number).
  // We'll reserve numbers up front:
  //   1: catalog
  //   2: pages
  //   3..(3+N-1): page objects
  //   (3+N)..(3+2N-1): page content streams
  //   (3+2N)..(3+3N-1): image XObjects
  const N = items.length;
  const pagesId = 2;
  const firstPageId = 3;
  const firstContentId = firstPageId + N;
  const firstImageId = firstContentId + N;

  // Pre-read all images as JPEG bytes + dims.
  const imageData: Array<{ bytes: Uint8Array; w: number; h: number }> = [];
  for (const item of items) {
    const ab = await item.file.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let w = 0;
    let h = 0;
    if (item.file.type === "image/jpeg") {
      // Parse SOFn marker for dimensions.
      const view = new DataView(ab);
      let off = 2;
      while (off < view.byteLength) {
        const marker = view.getUint16(off);
        off += 2;
        if (
          marker === 0xffc0 || marker === 0xffc1 || marker === 0xffc2 ||
          marker === 0xffc3 || marker === 0xffc5 || marker === 0xffc6 ||
          marker === 0xffc7 || marker === 0xffc9 || marker === 0xffca ||
          marker === 0xffcb || marker === 0xffcd || marker === 0xffce ||
          marker === 0xffcf
        ) {
          h = view.getUint16(off + 3);
          w = view.getUint16(off + 5);
          break;
        }
        const size = view.getUint16(off);
        off += size;
      }
      imageData.push({ bytes, w, h });
    } else {
      // Re-encode non-JPEGs to JPEG via canvas.
      const bitmap = await readImageBitmap(item.file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, bitmap.width, bitmap.height);
      ctx.drawImage(bitmap, 0, 0);
      const jpegBlob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/jpeg", 0.92),
      );
      if (!jpegBlob) throw new Error("JPEG encode failed");
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      imageData.push({ bytes: jpegBytes, w: bitmap.width, h: bitmap.height });
      bitmap.close();
    }
  }

  // 1: Catalog
  writeObj(1, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  // 2: Pages
  const kids = items.map((_, i) => `${firstPageId + i} 0 R`).join(" ");
  writeObj(pagesId, `<< /Type /Pages /Kids [${kids}] /Count ${N} >>`);

  // Determine page dimensions per item.
  const pageDims = imageData.map((img) => {
    if (pageSize === "fit") {
      return { pw: img.w, ph: img.h };
    }
    const [a, b] = SIZES_PT[pageSize];
    return orientation === "portrait" ? { pw: a, ph: b } : { pw: b, ph: a };
  });

  // Page objects.
  items.forEach((_, i) => {
    const { pw, ph } = pageDims[i];
    const imgId = firstImageId + i;
    const body =
      `<< /Type /Page /Parent ${pagesId} 0 R ` +
      `/MediaBox [0 0 ${pw} ${ph}] ` +
      `/Resources << /XObject << /Im${i} ${imgId} 0 R >> >> ` +
      `/Contents ${firstContentId + i} 0 R >>`;
    writeObj(firstPageId + i, body);
  });

  // Content streams: scale image into page with letterboxing.
  items.forEach((_, i) => {
    const { pw, ph } = pageDims[i];
    const { w, h } = imageData[i];
    const scale = Math.min(pw / w, ph / h);
    const drawW = w * scale;
    const drawH = h * scale;
    const x = (pw - drawW) / 2;
    const y = (ph - drawH) / 2;
    const stream = `q\n${drawW} 0 0 ${drawH} ${x} ${y} cm\n/Im${i} Do\nQ\n`;
    const streamBytes = enc.encode(stream);
    writeObj(
      firstContentId + i,
      `<< /Length ${streamBytes.length} >>\nstream\n${stream}endstream`,
    );
  });

  // Image XObjects.
  items.forEach((_, i) => {
    const { bytes, w, h } = imageData[i];
    const header =
      `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
      `/Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`;
    offsets[firstImageId + i] = position;
    push(`${firstImageId + i} 0 obj\n`);
    push(header);
    push(bytes);
    push("\nendstream\nendobj\n");
  });

  // Cross-reference table.
  const xrefOffset = position;
  const totalObjs = firstImageId + N - 1;
  push(`xref\n0 ${totalObjs + 1}\n`);
  push("0000000000 65535 f \n");
  for (let i = 1; i <= totalObjs; i++) {
    const off = offsets[i] ?? 0;
    push(`${off.toString().padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const total = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) {
    merged.set(c, pos);
    pos += c.length;
  }
  return new Blob([merged], { type: "application/pdf" });
}

export function ImageToPdf(): React.ReactElement {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("letter");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [busy, setBusy] = useState(false);

  const handle = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    setItems((prev) => [
      ...prev,
      ...images.map((file) => ({ id: crypto.randomUUID(), file })),
    ]);
  };

  const move = (idx: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const build = async () => {
    if (items.length === 0) return;
    setBusy(true);
    try {
      const pdf = await buildPdf(items, pageSize, orientation);
      downloadBlob(pdf, `snapforge-${Date.now()}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-card">
      <div className="control-row">
        <label className="control">
          <span className="control__label">Page size</span>
          <div className="segmented">
            <button
              type="button"
              className={`segmented__opt${pageSize === "letter" ? " is-on" : ""}`}
              onClick={() => setPageSize("letter")}
            >
              Letter
            </button>
            <button
              type="button"
              className={`segmented__opt${pageSize === "a4" ? " is-on" : ""}`}
              onClick={() => setPageSize("a4")}
            >
              A4
            </button>
            <button
              type="button"
              className={`segmented__opt${pageSize === "fit" ? " is-on" : ""}`}
              onClick={() => setPageSize("fit")}
            >
              Fit to image
            </button>
          </div>
        </label>
        {pageSize !== "fit" && (
          <label className="control">
            <span className="control__label">Orientation</span>
            <div className="segmented">
              <button
                type="button"
                className={`segmented__opt${orientation === "portrait" ? " is-on" : ""}`}
                onClick={() => setOrientation("portrait")}
              >
                Portrait
              </button>
              <button
                type="button"
                className={`segmented__opt${orientation === "landscape" ? " is-on" : ""}`}
                onClick={() => setOrientation("landscape")}
              >
                Landscape
              </button>
            </div>
          </label>
        )}
      </div>

      <DropZone
        accept="image/*"
        busy={busy}
        primary={busy ? "Building PDF…" : "Add images for your PDF"}
        hint="Reorder with the arrows below"
        onFiles={handle}
      />

      {items.length > 0 && (
        <>
          <div className="toolbar">
            <span className="toolbar__count">{items.length} page(s)</span>
            <div className="toolbar__actions">
              <button type="button" className="btn btn--primary" onClick={build} disabled={busy}>
                Build PDF
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setItems([])}>
                Clear
              </button>
            </div>
          </div>
          <ul className="file-list">
            {items.map((it, idx) => (
              <li key={it.id} className="file-row">
                <div className="file-row__main">
                  <span className="file-row__name">
                    <span className="pill pill--num">{idx + 1}</span> {it.file.name}
                  </span>
                  <span className="badge badge--queued">{formatBytes(it.file.size)}</span>
                </div>
                <div className="file-row__downloads">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => move(idx, 1)}
                    disabled={idx === items.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => remove(it.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
