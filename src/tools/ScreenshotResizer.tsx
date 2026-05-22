import { useCallback, useState } from "react";
import JSZip from "jszip";
import { DropZone } from "../components/DropZone";
import {
  baseNameWithoutExt,
  downloadBlob,
  encodeImage,
  formatBytes,
  isHeicFile,
  readImageBitmap,
} from "../lib/image";
import { FREE_BATCH_LIMIT, isPro, useSubscription } from "../lib/subscription";
import { Link } from "../lib/router";

type Preset = {
  id: string;
  label: string;
  width: number;
  height: number;
  device: "iphone" | "ipad";
};

const PRESETS: Preset[] = [
  { id: "iphone-1242-2688", device: "iphone", label: "iPhone 6.5\" — 1242 × 2688", width: 1242, height: 2688 },
  { id: "iphone-2688-1242", device: "iphone", label: "iPhone 6.5\" landscape — 2688 × 1242", width: 2688, height: 1242 },
  { id: "iphone-1284-2778", device: "iphone", label: "iPhone 6.7\" — 1284 × 2778", width: 1284, height: 2778 },
  { id: "iphone-2778-1284", device: "iphone", label: "iPhone 6.7\" landscape — 2778 × 1284", width: 2778, height: 1284 },
  { id: "iphone-1290-2796", device: "iphone", label: "iPhone 6.9\" — 1290 × 2796", width: 1290, height: 2796 },
  { id: "iphone-2796-1290", device: "iphone", label: "iPhone 6.9\" landscape — 2796 × 1290", width: 2796, height: 1290 },
  { id: "ipad-2064-2752", device: "ipad", label: "iPad 13\" — 2064 × 2752", width: 2064, height: 2752 },
  { id: "ipad-2752-2064", device: "ipad", label: "iPad 13\" landscape — 2752 × 2064", width: 2752, height: 2064 },
  { id: "ipad-2048-2732", device: "ipad", label: "iPad Pro — 2048 × 2732", width: 2048, height: 2732 },
  { id: "ipad-2732-2048", device: "ipad", label: "iPad Pro landscape — 2732 × 2048", width: 2732, height: 2048 },
];

type Item = {
  id: string;
  source: File;
  status: "working" | "done" | "error";
  blob?: Blob;
  errorMessage?: string;
};

export function ScreenshotResizer(): React.ReactElement {
  const sub = useSubscription();
  const pro = isPro(sub);
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  const preset = PRESETS.find((p) => p.id === presetId)!;

  const process = useCallback(
    async (raw: File[]) => {
      const files = raw.filter((f) => f.type.startsWith("image/") || isHeicFile(f));
      let todo = files;
      if (!pro) todo = todo.slice(0, FREE_BATCH_LIMIT);
      setBusy(true);
      try {
        for (const file of todo) {
          const id = crypto.randomUUID();
          setItems((p) => [{ id, source: file, status: "working" }, ...p]);
          try {
            let inputBlob: Blob = file;
            if (isHeicFile(file)) {
              const { default: heic2any } = await import("heic2any");
              const r = await heic2any({ blob: file, toType: "image/png" });
              inputBlob = (Array.isArray(r) ? r[0] : r) as Blob;
            }
            const bitmap = await readImageBitmap(inputBlob);
            const out = await encodeImage(bitmap, {
              format: "image/jpeg",
              quality: 0.92,
              width: preset.width,
              height: preset.height,
              fit: "cover",
            });
            bitmap.close();
            setItems((p) =>
              p.map((it) => (it.id === id ? { ...it, status: "done", blob: out } : it)),
            );
          } catch (err) {
            setItems((p) =>
              p.map((it) =>
                it.id === id
                  ? {
                      ...it,
                      status: "error",
                      errorMessage: err instanceof Error ? err.message : "Failed",
                    }
                  : it,
              ),
            );
          }
        }
      } finally {
        setBusy(false);
      }
    },
    [preset, pro],
  );

  const downloadAll = async () => {
    const done = items.filter((i) => i.status === "done" && i.blob);
    if (done.length === 0) return;
    if (done.length === 1) {
      downloadBlob(
        done[0].blob!,
        `${baseNameWithoutExt(done[0].source.name)}-${preset.width}x${preset.height}.jpg`,
      );
      return;
    }
    const zip = new JSZip();
    done.forEach((it) =>
      zip.file(
        `${baseNameWithoutExt(it.source.name)}-${preset.width}x${preset.height}.jpg`,
        it.blob!,
      ),
    );
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `snapforge-screenshots-${preset.width}x${preset.height}.zip`);
  };

  return (
    <div className="tool-card">
      <fieldset className="preset-fieldset">
        <legend className="preset-legend">App Store size</legend>
        <p className="preset-hint">
          Images are center-cropped to fill the exact resolution required by Apple.
        </p>
        <div className="preset-radios">
          <p className="preset-group-label">iPhone</p>
          {PRESETS.filter((p) => p.device === "iphone").map((p) => (
            <label key={p.id} className="preset-option">
              <input
                type="radio"
                name="screenshot-preset"
                checked={presetId === p.id}
                onChange={() => setPresetId(p.id)}
                disabled={busy}
              />
              <span>{p.label}</span>
            </label>
          ))}
          <p className="preset-group-label">iPad</p>
          {PRESETS.filter((p) => p.device === "ipad").map((p) => (
            <label key={p.id} className="preset-option">
              <input
                type="radio"
                name="screenshot-preset"
                checked={presetId === p.id}
                onChange={() => setPresetId(p.id)}
                disabled={busy}
              />
              <span>{p.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <DropZone
        accept="image/*,.heic,.heif"
        busy={busy}
        primary={busy ? "Resizing…" : "Drop screenshots here"}
        onFiles={process}
      />

      {items.length > 0 && (
        <>
          <div className="toolbar">
            <span className="toolbar__count">{items.length} file(s)</span>
            <div className="toolbar__actions">
              <button type="button" className="btn btn--primary" onClick={downloadAll} disabled={busy}>
                Download all as ZIP
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setItems([])}>
                Clear
              </button>
            </div>
          </div>
          <ul className="file-list">
            {items.map((it) => (
              <li key={it.id} className="file-row">
                <div className="file-row__main">
                  <span className="file-row__name">{it.source.name}</span>
                  <span className={`badge badge--${it.status === "done" ? "done" : it.status === "error" ? "error" : "converting"}`}>
                    {it.status === "working" && "Working…"}
                    {it.status === "done" && `${preset.width}×${preset.height}`}
                    {it.status === "error" && "Error"}
                  </span>
                </div>
                {it.blob && (
                  <p className="file-row__meta">{formatBytes(it.blob.size)}</p>
                )}
                {it.status === "error" && <p className="file-row__error">{it.errorMessage}</p>}
                {it.status === "done" && it.blob && (
                  <div className="file-row__downloads">
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        downloadBlob(
                          it.blob!,
                          `${baseNameWithoutExt(it.source.name)}-${preset.width}x${preset.height}.jpg`,
                        )
                      }
                    >
                      Download
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {!pro && (
        <p className="upgrade-hint">
          Free: {FREE_BATCH_LIMIT} screenshots per batch.{" "}
          <Link to="/pricing">Upgrade</Link> for unlimited batches.
        </p>
      )}
    </div>
  );
}
