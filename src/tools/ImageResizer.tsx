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
  readImageBitmap,
  type OutputFormat,
} from "../lib/image";
import {
  FREE_BATCH_LIMIT,
  FREE_FILE_SIZE_LIMIT,
  isPro,
  useSubscription,
} from "../lib/subscription";
import { Link } from "../lib/router";

type Mode = "pixels" | "percent";
type Fit = "cover" | "contain" | "stretch";

type Item = {
  id: string;
  source: File;
  status: "working" | "done" | "error";
  blob?: Blob;
  outW?: number;
  outH?: number;
  errorMessage?: string;
};

export function ImageResizer(): React.ReactElement {
  const sub = useSubscription();
  const pro = isPro(sub);
  const [mode, setMode] = useState<Mode>("pixels");
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [percent, setPercent] = useState(50);
  const [lockRatio, setLockRatio] = useState(true);
  const [fit, setFit] = useState<Fit>("contain");
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const process = useCallback(
    async (raw: File[]) => {
      const files = raw.filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) {
        setWarning("Drop image files.");
        return;
      }
      setWarning(null);
      let todo = files;
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
            let outW: number;
            let outH: number;
            if (mode === "percent") {
              outW = Math.max(1, Math.round((bitmap.width * percent) / 100));
              outH = Math.max(1, Math.round((bitmap.height * percent) / 100));
            } else if (lockRatio) {
              const ratio = bitmap.width / bitmap.height;
              outW = width;
              outH = Math.max(1, Math.round(width / ratio));
            } else {
              outW = width;
              outH = height;
            }
            const out = await encodeImage(bitmap, {
              format,
              quality: 0.9,
              width: outW,
              height: outH,
              fit,
            });
            bitmap.close();
            setItems((p) =>
              p.map((it) =>
                it.id === id ? { ...it, status: "done", blob: out, outW, outH } : it,
              ),
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
    [pro, mode, width, height, percent, lockRatio, fit, format],
  );

  const ext = FORMAT_EXTENSIONS[format];
  const downloadAll = async () => {
    const done = items.filter((i) => i.status === "done" && i.blob);
    if (done.length === 0) return;
    if (done.length === 1) {
      downloadBlob(
        done[0].blob!,
        `${baseNameWithoutExt(done[0].source.name)}-${done[0].outW}x${done[0].outH}.${ext}`,
      );
      return;
    }
    const zip = new JSZip();
    done.forEach((it) =>
      zip.file(`${baseNameWithoutExt(it.source.name)}-${it.outW}x${it.outH}.${ext}`, it.blob!),
    );
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `snapforge-resized-${Date.now()}.zip`);
  };

  return (
    <div className="tool-card">
      <div className="control-row">
        <label className="control">
          <span className="control__label">Mode</span>
          <div className="segmented">
            <button
              type="button"
              className={`segmented__opt${mode === "pixels" ? " is-on" : ""}`}
              onClick={() => setMode("pixels")}
              disabled={busy}
            >
              Pixels
            </button>
            <button
              type="button"
              className={`segmented__opt${mode === "percent" ? " is-on" : ""}`}
              onClick={() => setMode("percent")}
              disabled={busy}
            >
              Percent
            </button>
          </div>
        </label>

        {mode === "pixels" ? (
          <>
            <label className="control control--input">
              <span className="control__label">Width (px)</span>
              <input
                type="number"
                min={1}
                max={pro ? 20000 : 6000}
                value={width}
                onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value, 10) || 1))}
                disabled={busy}
              />
            </label>
            <label className="control control--input">
              <span className="control__label">Height (px)</span>
              <input
                type="number"
                min={1}
                max={pro ? 20000 : 6000}
                value={height}
                onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value, 10) || 1))}
                disabled={busy || lockRatio}
              />
            </label>
            <label className="control control--check">
              <input
                type="checkbox"
                checked={lockRatio}
                onChange={(e) => setLockRatio(e.target.checked)}
              />
              <span>Lock aspect ratio</span>
            </label>
          </>
        ) : (
          <label className="control">
            <span className="control__label">
              Scale <strong>{percent}%</strong>
            </span>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={percent}
              onChange={(e) => setPercent(parseInt(e.target.value, 10))}
              disabled={busy}
            />
          </label>
        )}
      </div>

      {mode === "pixels" && !lockRatio && (
        <div className="control-row">
          <label className="control">
            <span className="control__label">Fit</span>
            <div className="segmented">
              {(["contain", "cover", "stretch"] as Fit[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`segmented__opt${fit === f ? " is-on" : ""}`}
                  onClick={() => setFit(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </label>
        </div>
      )}

      <div className="control-row">
        <label className="control">
          <span className="control__label">Format</span>
          <div className="segmented">
            {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`segmented__opt${format === f ? " is-on" : ""}`}
                onClick={() => setFormat(f)}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        </label>
      </div>

      <DropZone
        accept="image/*"
        busy={busy}
        primary={busy ? "Resizing…" : "Drop images to resize"}
        hint="Any common image format"
        onFiles={process}
      />

      {warning && <p className="inline-warning">{warning}</p>}

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
                    {it.status === "done" && `${it.outW}×${it.outH}`}
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
                      onClick={() =>
                        downloadBlob(
                          it.blob!,
                          `${baseNameWithoutExt(it.source.name)}-${it.outW}x${it.outH}.${ext}`,
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
          Free: max 6000px wide · {FREE_BATCH_LIMIT} per batch · <Link to="/pricing">Pro</Link> unlocks up to 20000px.
        </p>
      )}
    </div>
  );
}
