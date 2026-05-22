import { useRef, useState, type MouseEvent } from "react";
import { DropZone } from "../components/DropZone";

type Sample = { hex: string; r: number; g: number; b: number };

function toHex(n: number): string {
  return n.toString(16).padStart(2, "0").toUpperCase();
}

export function ColorPicker(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sample, setSample] = useState<Sample | null>(null);
  const [palette, setPalette] = useState<Sample[]>([]);
  const [hasImage, setHasImage] = useState(false);

  const handle = async (files: File[]) => {
    const file = files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const bitmap = await createImageBitmap(file);
    const canvas = canvasRef.current;
    if (!canvas) {
      bitmap.close();
      return;
    }
    const maxW = 720;
    const scale = Math.min(1, maxW / bitmap.width);
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    setHasImage(true);
    setSample(null);
    setPalette([]);
  };

  const pick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(x, y, 1, 1).data;
    const s: Sample = {
      r: data[0],
      g: data[1],
      b: data[2],
      hex: `#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`,
    };
    setSample(s);
    setPalette((p) => {
      if (p.some((q) => q.hex === s.hex)) return p;
      return [s, ...p].slice(0, 8);
    });
  };

  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text);
  };

  return (
    <div className="tool-card">
      {!hasImage && (
        <DropZone
          accept="image/*"
          multiple={false}
          primary="Drop an image to pick colors"
          hint="Click anywhere on the image to read the pixel color"
          onFiles={handle}
        />
      )}
      <div className="color-picker__stage" style={{ display: hasImage ? "block" : "none" }}>
        <canvas
          ref={canvasRef}
          onClick={pick}
          className="color-picker__canvas"
          aria-label="Click the image to pick a color"
        />
      </div>

      {sample && (
        <div className="color-picker__sample">
          <span
            className="color-picker__swatch"
            style={{ background: sample.hex }}
            aria-hidden
          />
          <div className="color-picker__values">
            <button
              type="button"
              className="btn"
              onClick={() => copy(sample.hex)}
              title="Copy HEX"
            >
              {sample.hex}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => copy(`rgb(${sample.r}, ${sample.g}, ${sample.b})`)}
              title="Copy RGB"
            >
              rgb({sample.r}, {sample.g}, {sample.b})
            </button>
          </div>
        </div>
      )}

      {palette.length > 0 && (
        <div className="color-picker__palette">
          <h3>Recently picked</h3>
          <div className="color-picker__chips">
            {palette.map((p) => (
              <button
                key={p.hex}
                type="button"
                className="color-picker__chip"
                style={{ background: p.hex }}
                onClick={() => setSample(p)}
                title={p.hex}
              >
                <span>{p.hex}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasImage && (
        <div className="toolbar">
          <span className="toolbar__count">Click anywhere on the image</span>
          <div className="toolbar__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setHasImage(false);
                setSample(null);
                setPalette([]);
              }}
            >
              Load a different image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
