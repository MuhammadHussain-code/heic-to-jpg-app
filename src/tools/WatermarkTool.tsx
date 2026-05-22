import { useCallback, useState } from "react";
import JSZip from "jszip";
import { DropZone } from "../components/DropZone";
import {
  baseNameWithoutExt,
  downloadBlob,
  readImageBitmap,
} from "../lib/image";

type Position = "tl" | "tr" | "bl" | "br" | "center";

const POSITIONS: Array<{ id: Position; label: string }> = [
  { id: "tl", label: "Top left" },
  { id: "tr", label: "Top right" },
  { id: "bl", label: "Bottom left" },
  { id: "br", label: "Bottom right" },
  { id: "center", label: "Center" },
];

type Item = {
  id: string;
  source: File;
  status: "working" | "done" | "error";
  blob?: Blob;
  errorMessage?: string;
};

async function applyWatermark(
  file: File,
  text: string,
  opacity: number,
  position: Position,
  sizePct: number,
): Promise<Blob> {
  const bitmap = await readImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const fontSize = Math.max(16, Math.round((canvas.width * sizePct) / 100));
  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.strokeStyle = `rgba(0, 0, 0, ${Math.min(1, opacity + 0.2)})`;
  ctx.lineWidth = Math.max(1, fontSize / 24);
  ctx.textBaseline = "middle";
  const padding = Math.max(16, Math.round(canvas.width * 0.02));
  const metrics = ctx.measureText(text);
  const textW = metrics.width;
  const textH = fontSize;

  let x: number;
  let y: number;
  switch (position) {
    case "tl":
      ctx.textAlign = "left";
      x = padding;
      y = padding + textH / 2;
      break;
    case "tr":
      ctx.textAlign = "right";
      x = canvas.width - padding;
      y = padding + textH / 2;
      break;
    case "bl":
      ctx.textAlign = "left";
      x = padding;
      y = canvas.height - padding - textH / 2;
      break;
    case "br":
      ctx.textAlign = "right";
      x = canvas.width - padding;
      y = canvas.height - padding - textH / 2;
      break;
    default:
      ctx.textAlign = "center";
      x = canvas.width / 2;
      y = canvas.height / 2;
      break;
  }
  // ensure we don't trigger an unused-var lint on textW
  void textW;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);

  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, file.type === "image/png" ? "image/png" : "image/jpeg", 0.92),
  );
  if (!out) throw new Error("Encode failed");
  return out;
}

export function WatermarkTool(): React.ReactElement {
  const [text, setText] = useState("© SnapForge");
  const [opacity, setOpacity] = useState(0.55);
  const [position, setPosition] = useState<Position>("br");
  const [sizePct, setSizePct] = useState(5);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  const process = useCallback(
    async (raw: File[]) => {
      const files = raw.filter((f) => f.type.startsWith("image/"));
      setBusy(true);
      try {
        for (const file of files) {
          const id = crypto.randomUUID();
          setItems((p) => [{ id, source: file, status: "working" }, ...p]);
          try {
            const out = await applyWatermark(file, text, opacity, position, sizePct);
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
    [text, opacity, position, sizePct],
  );

  const downloadAll = async () => {
    const done = items.filter((i) => i.status === "done" && i.blob);
    if (done.length === 0) return;
    if (done.length === 1) {
      const ext = done[0].source.type === "image/png" ? "png" : "jpg";
      downloadBlob(done[0].blob!, `${baseNameWithoutExt(done[0].source.name)}-watermarked.${ext}`);
      return;
    }
    const zip = new JSZip();
    done.forEach((it) => {
      const ext = it.source.type === "image/png" ? "png" : "jpg";
      zip.file(`${baseNameWithoutExt(it.source.name)}-watermarked.${ext}`, it.blob!);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `snapforge-watermarked-${Date.now()}.zip`);
  };

  return (
    <div className="tool-card">
      <div className="control-row">
        <label className="control control--input control--wide">
          <span className="control__label">Watermark text</span>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
            placeholder="© Your name"
          />
        </label>
        <label className="control">
          <span className="control__label">Position</span>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
            disabled={busy}
            className="control__select"
          >
            {POSITIONS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="control-row">
        <label className="control">
          <span className="control__label">
            Opacity <strong>{Math.round(opacity * 100)}%</strong>
          </span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
          />
        </label>
        <label className="control">
          <span className="control__label">
            Size <strong>{sizePct}%</strong>
          </span>
          <input
            type="range"
            min={2}
            max={15}
            step={1}
            value={sizePct}
            onChange={(e) => setSizePct(parseInt(e.target.value, 10))}
          />
        </label>
      </div>

      <DropZone
        accept="image/*"
        busy={busy}
        primary={busy ? "Stamping…" : "Drop images to watermark"}
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
                      onClick={() => {
                        const ext = it.source.type === "image/png" ? "png" : "jpg";
                        downloadBlob(
                          it.blob!,
                          `${baseNameWithoutExt(it.source.name)}-watermarked.${ext}`,
                        );
                      }}
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
    </div>
  );
}
