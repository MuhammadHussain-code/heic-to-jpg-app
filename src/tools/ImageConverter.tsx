import { useCallback, useState } from "react";
import JSZip from "jszip";
import { DropZone } from "../components/DropZone";
import {
  FORMAT_EXTENSIONS,
  FORMAT_LABELS,
  baseNameWithoutExt,
  downloadBlob,
  encodeImage,
  formatBytes,
  isHeicFile,
  readImageBitmap,
  type OutputFormat,
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
  status: "converting" | "done" | "error";
  blob?: Blob;
  errorMessage?: string;
};

export function ImageConverter(): React.ReactElement {
  const sub = useSubscription();
  const pro = isPro(sub);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const processFiles = useCallback(
    async (rawFiles: File[]) => {
      const files = rawFiles.filter((f) => f.type.startsWith("image/") || isHeicFile(f));
      if (files.length === 0) {
        setWarning("Please drop image files (JPG, PNG, WebP, HEIC).");
        return;
      }
      setWarning(null);
      let toProcess = files;
      if (!pro && files.length > FREE_BATCH_LIMIT) {
        setWarning(
          `Free plan converts up to ${FREE_BATCH_LIMIT} files at a time. Upgrade for unlimited.`,
        );
        toProcess = files.slice(0, FREE_BATCH_LIMIT);
      }
      if (!pro) {
        toProcess = toProcess.filter((f) => f.size <= FREE_FILE_SIZE_LIMIT);
      }

      setBusy(true);
      try {
        for (const file of toProcess) {
          const id = crypto.randomUUID();
          setItems((prev) => [{ id, source: file, status: "converting" }, ...prev]);
          try {
            let inputBlob: Blob = file;
            if (isHeicFile(file)) {
              const { default: heic2any } = await import("heic2any");
              const result = await heic2any({ blob: file, toType: "image/png", quality: 1 });
              inputBlob = (Array.isArray(result) ? result[0] : result) as Blob;
            }
            const bitmap = await readImageBitmap(inputBlob);
            const out = await encodeImage(bitmap, { format, quality });
            bitmap.close();
            setItems((prev) =>
              prev.map((it) => (it.id === id ? { ...it, status: "done", blob: out } : it)),
            );
            recordConversion({
              tool: "Image Converter",
              filename: file.name,
              bytesIn: file.size,
              bytesOut: out.size,
            });
          } catch (err) {
            setItems((prev) =>
              prev.map((it) =>
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
    [format, quality, pro],
  );

  const ext = FORMAT_EXTENSIONS[format];

  const downloadAll = async () => {
    const done = items.filter((i) => i.status === "done" && i.blob);
    if (done.length === 0) return;
    if (done.length === 1) {
      downloadBlob(done[0].blob!, `${baseNameWithoutExt(done[0].source.name)}.${ext}`);
      return;
    }
    const zip = new JSZip();
    done.forEach((it) =>
      zip.file(`${baseNameWithoutExt(it.source.name)}.${ext}`, it.blob!),
    );
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `snapforge-converted-${Date.now()}.zip`);
  };

  return (
    <div className="tool-card">
      <div className="control-row">
        <label className="control">
          <span className="control__label">Output format</span>
          <div className="segmented">
            {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`segmented__opt${format === f ? " is-on" : ""}`}
                onClick={() => setFormat(f)}
                disabled={busy}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        </label>

        {format !== "image/png" && (
          <label className="control">
            <span className="control__label">
              Quality <strong>{Math.round(quality * 100)}%</strong>
            </span>
            <input
              type="range"
              min={0.4}
              max={1}
              step={0.02}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              disabled={busy}
            />
          </label>
        )}
      </div>

      <DropZone
        accept="image/*,.heic,.heif"
        busy={busy}
        primary={busy ? "Converting…" : `Drop images to convert to ${FORMAT_LABELS[format]}`}
        hint="JPG · PNG · WebP · HEIC — converted locally"
        onFiles={processFiles}
      />

      {warning && <p className="inline-warning">{warning}</p>}

      {items.length > 0 && (
        <>
          <div className="toolbar">
            <span className="toolbar__count">{items.length} file(s)</span>
            <div className="toolbar__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={downloadAll}
                disabled={items.every((i) => i.status !== "done") || busy}
              >
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
                  <span className="file-row__name" title={it.source.name}>
                    {it.source.name}
                  </span>
                  <span className={`badge badge--${it.status === "done" ? "done" : it.status === "error" ? "error" : "converting"}`}>
                    {it.status === "converting" && "Converting…"}
                    {it.status === "done" && "Ready"}
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
                {it.status === "error" && (
                  <p className="file-row__error">{it.errorMessage}</p>
                )}
                {it.status === "done" && it.blob && (
                  <div className="file-row__downloads">
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        downloadBlob(it.blob!, `${baseNameWithoutExt(it.source.name)}.${ext}`)
                      }
                    >
                      Download .{ext}
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
          Free: {FREE_BATCH_LIMIT} per batch · 50 MB per file ·{" "}
          <Link to="/pricing">Upgrade</Link> for unlimited & larger files.
        </p>
      )}
    </div>
  );
}
