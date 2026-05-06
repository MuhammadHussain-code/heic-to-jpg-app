import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

type ItemStatus = "queued" | "converting" | "done" | "error";

type ScreenshotPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  device: "iphone" | "ipad";
};

const SCREENSHOT_PRESETS: ScreenshotPreset[] = [
  { id: "iphone-1242-2688", device: "iphone", label: "1242 × 2688", width: 1242, height: 2688 },
  { id: "iphone-2688-1242", device: "iphone", label: "2688 × 1242", width: 2688, height: 1242 },
  { id: "iphone-1284-2778", device: "iphone", label: "1284 × 2778", width: 1284, height: 2778 },
  { id: "iphone-2778-1284", device: "iphone", label: "2778 × 1284", width: 2778, height: 1284 },
  { id: "ipad-2064-2752", device: "ipad", label: "2064 × 2752", width: 2064, height: 2752 },
  { id: "ipad-2752-2064", device: "ipad", label: "2752 × 2064", width: 2752, height: 2064 },
  { id: "ipad-2048-2732", device: "ipad", label: "2048 × 2732", width: 2048, height: 2732 },
  { id: "ipad-2732-2048", device: "ipad", label: "2732 × 2048", width: 2732, height: 2048 },
];

type QueueItem = {
  id: string;
  sourceName: string;
  status: ItemStatus;
  jpgBlobs: Blob[];
  errorMessage?: string;
  /** Set when conversion finishes; used for download names. */
  outputDimensions?: { width: number; height: number } | null;
};

function isHeicFile(file: File): boolean {
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

function baseNameWithoutExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Scale with cover fit and center crop so output is exactly targetWidth × targetHeight. */
async function resizeBlobToJpegExact(
  blob: Blob,
  targetWidth: number,
  targetHeight: number,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    const sw = bitmap.width;
    const sh = bitmap.height;
    const scale = Math.max(targetWidth / sw, targetHeight / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (targetWidth - dw) / 2;
    const dy = (targetHeight - dh) / 2;
    ctx.drawImage(bitmap, dx, dy, dw, dh);

    const encoded = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!encoded) throw new Error("JPEG encode failed");
    return encoded;
  } finally {
    bitmap.close();
  }
}

function findPreset(id: string | null): ScreenshotPreset | undefined {
  if (!id) return undefined;
  return SCREENSHOT_PRESETS.find((p) => p.id === id);
}

export function App() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const processFiles = useCallback(async (raw: FileList | File[]) => {
    const heics = [...raw].filter(isHeicFile);
    if (heics.length === 0) return;

    const preset = findPreset(selectedPresetId);

    setBusy(true);
    try {
      const { default: heic2any } = await import("heic2any");
      for (const file of heics) {
        const id = crypto.randomUUID();
        setItems((prev) => [
          {
            id,
            sourceName: file.name,
            status: "queued",
            jpgBlobs: [],
            outputDimensions: undefined,
          },
          ...prev,
        ]);

        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "converting" } : item,
          ),
        );

        try {
          const result = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.92,
          });
          let blobs: Blob[] = Array.isArray(result) ? result : [result];
          if (preset) {
            blobs = await Promise.all(
              blobs.map((b) =>
                resizeBlobToJpegExact(b, preset.width, preset.height, 0.92),
              ),
            );
          }
          setItems((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "done",
                    jpgBlobs: blobs,
                    outputDimensions: preset
                      ? { width: preset.width, height: preset.height }
                      : null,
                  }
                : item,
            ),
          );
        } catch (unknownError) {
          const errorMessage =
            unknownError instanceof Error
              ? unknownError.message
              : "Conversion failed";
          setItems((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, status: "error", errorMessage }
                : item,
            ),
          );
        }
      }
    } finally {
      setBusy(false);
    }
  }, [selectedPresetId]);

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    void processFiles(event.dataTransfer.files);
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files?.length) void processFiles(files);
    event.target.value = "";
  };

  const clearDone = () => {
    setItems((prev) => prev.filter((i) => i.status !== "done"));
  };

  const clearAll = () => setItems([]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">HEIC → JPG</h1>
        <p className="app-subtitle">
          Drop iPhone photos here or choose files. Everything runs in your
          browser; images are not uploaded.
        </p>
      </header>

      <fieldset className="preset-fieldset">
        <legend className="preset-legend">Output size (optional)</legend>
        <p className="preset-hint">
          App Store screenshot sizes. Images are center-cropped to fill the
          exact resolution.
        </p>
        <div className="preset-radios">
          <label className="preset-option">
            <input
              type="radio"
              name="screenshot-preset"
              checked={selectedPresetId === null}
              onChange={() => setSelectedPresetId(null)}
              disabled={busy}
            />
            <span>Original size (no resize)</span>
          </label>

          <p className="preset-group-label">iPhone</p>
          {SCREENSHOT_PRESETS.filter((p) => p.device === "iphone").map((p) => (
            <label key={p.id} className="preset-option">
              <input
                type="radio"
                name="screenshot-preset"
                checked={selectedPresetId === p.id}
                onChange={() => setSelectedPresetId(p.id)}
                disabled={busy}
              />
              <span>{p.label}px</span>
            </label>
          ))}

          <p className="preset-group-label">iPad</p>
          {SCREENSHOT_PRESETS.filter((p) => p.device === "ipad").map((p) => (
            <label key={p.id} className="preset-option">
              <input
                type="radio"
                name="screenshot-preset"
                checked={selectedPresetId === p.id}
                onChange={() => setSelectedPresetId(p.id)}
                disabled={busy}
              />
              <span>{p.label}px</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor={inputId} className="visually-hidden">
        Select HEIC or HEIF files to convert
      </label>

      <button
        type="button"
        className={`drop-zone${dragOver ? " drop-zone--active" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        aria-label="Add HEIC files by drag and drop or file picker"
      >
        <span className="drop-zone__icon" aria-hidden>
          ⬇
        </span>
        <span className="drop-zone__primary">
          {busy ? "Converting…" : "Drop HEIC files here"}
        </span>
        {!busy && (
          <span className="drop-zone__secondary">or click to browse</span>
        )}
      </button>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="visually-hidden"
        accept=".heic,.heif,image/heic,image/heif"
        multiple
        onChange={onFileInputChange}
      />

      {items.length > 0 && (
        <div className="toolbar">
          <span className="toolbar__count">{items.length} file(s)</span>
          <div className="toolbar__actions">
            <button type="button" className="btn btn--ghost" onClick={clearDone}>
              Clear done
            </button>
            <button type="button" className="btn btn--ghost" onClick={clearAll}>
              Clear all
            </button>
          </div>
        </div>
      )}

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

            {item.status === "error" && item.errorMessage && (
              <p className="file-row__error">{item.errorMessage}</p>
            )}

            {item.status === "done" && item.jpgBlobs.length > 0 && (
              <div className="file-row__downloads">
                {item.jpgBlobs.map((blob, index) => {
                  const base = baseNameWithoutExt(item.sourceName);
                  const multiSuffix =
                    item.jpgBlobs.length > 1 ? `-${index + 1}` : "";
                  const dims = item.outputDimensions;
                  const sizeSuffix = dims
                    ? `-${dims.width}x${dims.height}`
                    : "";
                  const filename = `${base}${multiSuffix}${sizeSuffix}.jpg`;
                  return (
                    <button
                      key={`${item.id}-${index}`}
                      type="button"
                      className="btn btn--primary"
                      onClick={() => downloadBlob(blob, filename)}
                    >
                      Download {item.jpgBlobs.length > 1 ? `#${index + 1} ` : ""}
                      JPG
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
