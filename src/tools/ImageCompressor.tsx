import { useCallback, useState } from "react";
import JSZip from "jszip";
import { DropZone } from "../components/DropZone";
import {
  baseNameWithoutExt,
  downloadBlob,
  encodeImage,
  formatBytes,
  readImageBitmap,
} from "../lib/image";
import {
  FREE_BATCH_LIMIT,
  FREE_FILE_SIZE_LIMIT,
  isPro,
  useSubscription,
} from "../lib/subscription";
import { recordConversion } from "../lib/usage";
import { Link } from "../lib/router";

type Item = {
  id: string;
  source: File;
  status: "working" | "done" | "error";
  blob?: Blob;
  errorMessage?: string;
};

export function ImageCompressor(): React.ReactElement {
  const sub = useSubscription();
  const pro = isPro(sub);
  const [quality, setQuality] = useState(0.75);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const process = useCallback(
    async (raw: File[]) => {
      const supported = raw.filter(
        (f) => f.type === "image/jpeg" || f.type === "image/png" || f.type === "image/webp",
      );
      if (supported.length === 0) {
        setWarning("Drop JPG, PNG, or WebP files.");
        return;
      }
      setWarning(null);
      let todo = supported;
      if (!pro && todo.length > FREE_BATCH_LIMIT) {
        setWarning(`Free plan: ${FREE_BATCH_LIMIT} files per batch.`);
        todo = todo.slice(0, FREE_BATCH_LIMIT);
      }
      if (!pro) todo = todo.filter((f) => f.size <= FREE_FILE_SIZE_LIMIT);

      setBusy(true);
      try {
        for (const file of todo) {
          const id = crypto.randomUUID();
          setItems((p) => [{ id, source: file, status: "working" }, ...p]);
          try {
            const bitmap = await readImageBitmap(file);
            const out = await encodeImage(bitmap, {
              format: file.type === "image/png" ? "image/png" : (file.type as never),
              quality,
            });
            bitmap.close();
            setItems((p) =>
              p.map((it) => (it.id === id ? { ...it, status: "done", blob: out } : it)),
            );
            recordConversion({
              tool: "Image Compressor",
              filename: file.name,
              bytesIn: file.size,
              bytesOut: out.size,
            });
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
    [pro, quality],
  );

  const downloadAll = async () => {
    const done = items.filter((i) => i.status === "done" && i.blob);
    if (done.length === 0) return;
    if (done.length === 1) {
      const ext = done[0].source.name.split(".").pop() ?? "jpg";
      downloadBlob(done[0].blob!, `${baseNameWithoutExt(done[0].source.name)}-compressed.${ext}`);
      return;
    }
    const zip = new JSZip();
    done.forEach((it) => {
      const ext = it.source.name.split(".").pop() ?? "jpg";
      zip.file(`${baseNameWithoutExt(it.source.name)}-compressed.${ext}`, it.blob!);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `snapforge-compressed-${Date.now()}.zip`);
  };

  const totalIn = items.reduce((s, i) => s + i.source.size, 0);
  const totalOut = items.reduce((s, i) => s + (i.blob?.size ?? 0), 0);
  const savedPct =
    totalIn > 0 ? Math.max(0, Math.round((1 - totalOut / totalIn) * 100)) : 0;

  return (
    <div className="tool-card">
      <div className="control-row">
        <label className="control">
          <span className="control__label">
            Target quality <strong>{Math.round(quality * 100)}%</strong>
          </span>
          <input
            type="range"
            min={0.3}
            max={0.95}
            step={0.02}
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            disabled={busy}
          />
          <span className="control__hint">
            Lower = smaller files. 70-85% looks great for most photos.
          </span>
        </label>
      </div>

      <DropZone
        accept="image/jpeg,image/png,image/webp"
        busy={busy}
        primary={busy ? "Compressing…" : "Drop JPG / PNG / WebP to compress"}
        hint="All processing happens in your browser"
        onFiles={process}
      />

      {warning && <p className="inline-warning">{warning}</p>}

      {items.length > 0 && (
        <>
          <div className="toolbar">
            <span className="toolbar__count">
              {formatBytes(totalIn)} → {formatBytes(totalOut)} (saved {savedPct}%)
            </span>
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
            {items.map((it) => {
              const pct = it.blob
                ? Math.max(0, Math.round((1 - it.blob.size / it.source.size) * 100))
                : 0;
              return (
                <li key={it.id} className="file-row">
                  <div className="file-row__main">
                    <span className="file-row__name">{it.source.name}</span>
                    <span className={`badge badge--${it.status === "done" ? "done" : it.status === "error" ? "error" : "converting"}`}>
                      {it.status === "working" && "Working…"}
                      {it.status === "done" && `−${pct}%`}
                      {it.status === "error" && "Error"}
                    </span>
                  </div>
                  <p className="file-row__meta">
                    {formatBytes(it.source.size)}
                    {it.blob && (
                      <>
                        {" → "}
                        <strong>{formatBytes(it.blob.size)}</strong>
                      </>
                    )}
                  </p>
                  {it.status === "error" && <p className="file-row__error">{it.errorMessage}</p>}
                  {it.status === "done" && it.blob && (
                    <div className="file-row__downloads">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          const ext = it.source.name.split(".").pop() ?? "jpg";
                          downloadBlob(
                            it.blob!,
                            `${baseNameWithoutExt(it.source.name)}-compressed.${ext}`,
                          );
                        }}
                      >
                        Download
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {!pro && (
        <p className="upgrade-hint">
          Free: {FREE_BATCH_LIMIT} per batch. <Link to="/pricing">Upgrade</Link> for unlimited.
        </p>
      )}
    </div>
  );
}
