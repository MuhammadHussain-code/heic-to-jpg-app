import { useCallback, useState } from "react";
import JSZip from "jszip";
import { DropZone } from "../components/DropZone";
import {
  FREE_BATCH_LIMIT,
  FREE_FILE_SIZE_LIMIT,
  isPro,
  useSubscription,
} from "../lib/subscription";
import {
  baseNameWithoutExt,
  downloadBlob,
  formatBytes,
  isHeicFile,
} from "../lib/image";
import { recordConversion } from "../lib/usage";
import { Link } from "../lib/router";

type ItemStatus = "queued" | "converting" | "done" | "error";

type QueueItem = {
  id: string;
  sourceName: string;
  sourceSize: number;
  status: ItemStatus;
  jpgBlobs: Blob[];
  outputSize?: number;
  errorMessage?: string;
};

type Quality = "high" | "balanced" | "small";

const QUALITY_VALUES: Record<Quality, number> = {
  high: 0.95,
  balanced: 0.88,
  small: 0.75,
};

export function HeicToJpg(): React.ReactElement {
  const sub = useSubscription();
  const pro = isPro(sub);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [quality, setQuality] = useState<Quality>("balanced");
  const [warning, setWarning] = useState<string | null>(null);

  const processFiles = useCallback(
    async (rawFiles: File[]) => {
      const heics = rawFiles.filter(isHeicFile);
      if (heics.length === 0) {
        setWarning("Drop HEIC or HEIF files. Other formats use the Image Converter.");
        return;
      }
      setWarning(null);

      let toProcess = heics;
      if (!pro && heics.length > FREE_BATCH_LIMIT) {
        setWarning(
          `Free plan converts up to ${FREE_BATCH_LIMIT} files at a time. The first ${FREE_BATCH_LIMIT} will be processed — upgrade to Pro for unlimited batches.`,
        );
        toProcess = heics.slice(0, FREE_BATCH_LIMIT);
      }
      if (!pro) {
        const oversized = toProcess.find((f) => f.size > FREE_FILE_SIZE_LIMIT);
        if (oversized) {
          setWarning(
            `${oversized.name} is over the free 50 MB limit. Upgrade to Pro for files up to 1 GB.`,
          );
          toProcess = toProcess.filter((f) => f.size <= FREE_FILE_SIZE_LIMIT);
          if (toProcess.length === 0) return;
        }
      }

      setBusy(true);
      try {
        const { default: heic2any } = await import("heic2any");
        for (const file of toProcess) {
          const id = crypto.randomUUID();
          setItems((prev) => [
            { id, sourceName: file.name, sourceSize: file.size, status: "converting", jpgBlobs: [] },
            ...prev,
          ]);

          try {
            const result = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: QUALITY_VALUES[quality],
            });
            const blobs: Blob[] = Array.isArray(result) ? result : [result];
            const outputSize = blobs.reduce((sum, b) => sum + b.size, 0);
            setItems((prev) =>
              prev.map((it) =>
                it.id === id ? { ...it, status: "done", jpgBlobs: blobs, outputSize } : it,
              ),
            );
            recordConversion({
              tool: "HEIC to JPG",
              filename: file.name,
              bytesIn: file.size,
              bytesOut: outputSize,
            });
          } catch (err) {
            setItems((prev) =>
              prev.map((it) =>
                it.id === id
                  ? {
                      ...it,
                      status: "error",
                      errorMessage:
                        err instanceof Error ? err.message : "Conversion failed",
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
    const done = items.filter((i) => i.status === "done");
    if (done.length === 0) return;
    if (done.length === 1 && done[0].jpgBlobs.length === 1) {
      const base = baseNameWithoutExt(done[0].sourceName);
      downloadBlob(done[0].jpgBlobs[0], `${base}.jpg`);
      return;
    }
    const zip = new JSZip();
    for (const item of done) {
      const base = baseNameWithoutExt(item.sourceName);
      item.jpgBlobs.forEach((blob, i) => {
        const suffix = item.jpgBlobs.length > 1 ? `-${i + 1}` : "";
        zip.file(`${base}${suffix}.jpg`, blob);
      });
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob(zipBlob, `snapforge-heic-to-jpg-${Date.now()}.zip`);
  };

  const doneCount = items.filter((i) => i.status === "done").length;
  const totalIn = items.reduce((s, i) => s + i.sourceSize, 0);
  const totalOut = items.reduce((s, i) => s + (i.outputSize ?? 0), 0);
  const saved = Math.max(0, totalIn - totalOut);

  return (
    <div className="tool-card">
      <div className="control-row">
        <label className="control">
          <span className="control__label">Quality</span>
          <div className="segmented">
            {(Object.keys(QUALITY_VALUES) as Quality[]).map((q) => (
              <button
                key={q}
                type="button"
                className={`segmented__opt${quality === q ? " is-on" : ""}`}
                onClick={() => setQuality(q)}
                disabled={busy}
              >
                {q === "high" ? "High (95%)" : q === "balanced" ? "Balanced (88%)" : "Small (75%)"}
              </button>
            ))}
          </div>
        </label>
      </div>

      <DropZone
        accept=".heic,.heif,image/heic,image/heif"
        busy={busy}
        primary={busy ? "Converting…" : "Drop HEIC files here"}
        hint="or click to browse — files never leave your device"
        onFiles={processFiles}
      />

      {warning && <p className="inline-warning">{warning}</p>}

      {items.length > 0 && (
        <>
          <div className="toolbar">
            <span className="toolbar__count">
              {doneCount} / {items.length} ready · saved {formatBytes(saved)}
            </span>
            <div className="toolbar__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={downloadAll}
                disabled={doneCount === 0 || busy}
              >
                Download all as ZIP
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setItems((p) => p.filter((i) => i.status !== "done"))}
              >
                Clear done
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setItems([])}>
                Clear all
              </button>
            </div>
          </div>

          <ul className="file-list" aria-live="polite">
            {items.map((item) => (
              <li key={item.id} className="file-row">
                <div className="file-row__main">
                  <span className="file-row__name" title={item.sourceName}>
                    {item.sourceName}
                  </span>
                  <span className={`badge badge--${item.status}`}>
                    {item.status === "queued" && "Queued"}
                    {item.status === "converting" && "Converting…"}
                    {item.status === "done" && "Ready"}
                    {item.status === "error" && "Error"}
                  </span>
                </div>
                <p className="file-row__meta">
                  {formatBytes(item.sourceSize)}
                  {item.outputSize !== undefined && (
                    <>
                      {" → "}
                      <strong>{formatBytes(item.outputSize)}</strong>
                    </>
                  )}
                </p>
                {item.status === "error" && item.errorMessage && (
                  <p className="file-row__error">{item.errorMessage}</p>
                )}
                {item.status === "done" && item.jpgBlobs.length > 0 && (
                  <div className="file-row__downloads">
                    {item.jpgBlobs.map((blob, idx) => {
                      const base = baseNameWithoutExt(item.sourceName);
                      const suffix = item.jpgBlobs.length > 1 ? `-${idx + 1}` : "";
                      return (
                        <button
                          key={idx}
                          type="button"
                          className="btn"
                          onClick={() => downloadBlob(blob, `${base}${suffix}.jpg`)}
                        >
                          Download {item.jpgBlobs.length > 1 ? `#${idx + 1} ` : ""}JPG
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {!pro && (
        <p className="upgrade-hint">
          Free plan: {FREE_BATCH_LIMIT} files per batch · 50 MB per file ·{" "}
          <Link to="/pricing">Upgrade for unlimited</Link>.
        </p>
      )}
    </div>
  );
}
