import { useCallback, useState } from "react";
import JSZip from "jszip";
import { DropZone } from "../components/DropZone";
import {
  FORMAT_EXTENSIONS,
  FORMAT_LABELS,
  baseNameWithoutExt,
  downloadBlob,
  encodeImage,
  readImageBitmap,
  type OutputFormat,
} from "../lib/image";
import { Link } from "../lib/router";
import { FREE_BATCH_LIMIT, isPro, useSubscription } from "../lib/subscription";

type Item = {
  id: string;
  source: File;
  status: "working" | "done" | "error";
  blob?: Blob;
  errorMessage?: string;
};

export function ImageRotator(): React.ReactElement {
  const sub = useSubscription();
  const pro = isPro(sub);
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(90);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  const process = useCallback(
    async (raw: File[]) => {
      const files = raw.filter((f) => f.type.startsWith("image/"));
      let todo = files;
      if (!pro) todo = todo.slice(0, FREE_BATCH_LIMIT);
      setBusy(true);
      try {
        for (const file of todo) {
          const id = crypto.randomUUID();
          setItems((p) => [{ id, source: file, status: "working" }, ...p]);
          try {
            const bitmap = await readImageBitmap(file);
            const out = await encodeImage(bitmap, {
              format,
              quality: 0.92,
              rotate,
              flipH,
              flipV,
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
    [pro, rotate, flipH, flipV, format],
  );

  const ext = FORMAT_EXTENSIONS[format];
  const downloadAll = async () => {
    const done = items.filter((i) => i.status === "done" && i.blob);
    if (done.length === 0) return;
    if (done.length === 1) {
      downloadBlob(done[0].blob!, `${baseNameWithoutExt(done[0].source.name)}-rotated.${ext}`);
      return;
    }
    const zip = new JSZip();
    done.forEach((it) =>
      zip.file(`${baseNameWithoutExt(it.source.name)}-rotated.${ext}`, it.blob!),
    );
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `snapforge-rotated-${Date.now()}.zip`);
  };

  return (
    <div className="tool-card">
      <div className="control-row">
        <label className="control">
          <span className="control__label">Rotate</span>
          <div className="segmented">
            {([0, 90, 180, 270] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={`segmented__opt${rotate === r ? " is-on" : ""}`}
                onClick={() => setRotate(r)}
              >
                {r}°
              </button>
            ))}
          </div>
        </label>
        <label className="control control--check">
          <input type="checkbox" checked={flipH} onChange={(e) => setFlipH(e.target.checked)} />
          <span>Flip horizontal</span>
        </label>
        <label className="control control--check">
          <input type="checkbox" checked={flipV} onChange={(e) => setFlipV(e.target.checked)} />
          <span>Flip vertical</span>
        </label>
        <label className="control">
          <span className="control__label">Output</span>
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
        primary={busy ? "Working…" : "Drop images to rotate / flip"}
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
                    {it.status === "done" && "Ready"}
                    {it.status === "error" && "Error"}
                  </span>
                </div>
                {it.status === "error" && <p className="file-row__error">{it.errorMessage}</p>}
                {it.status === "done" && it.blob && (
                  <div className="file-row__downloads">
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        downloadBlob(
                          it.blob!,
                          `${baseNameWithoutExt(it.source.name)}-rotated.${ext}`,
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
          Free: {FREE_BATCH_LIMIT} per batch. <Link to="/pricing">Upgrade</Link> for unlimited.
        </p>
      )}
    </div>
  );
}
