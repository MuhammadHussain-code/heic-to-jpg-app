import { useState } from "react";
import { DropZone } from "../components/DropZone";
import {
  baseNameWithoutExt,
  downloadBlob,
  encodeImage,
  formatBytes,
  readExif,
  readImageBitmap,
  type ExifSummary,
} from "../lib/image";

type Result = {
  file: File;
  exif: ExifSummary | null;
};

export function ExifViewer(): React.ReactElement {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [stripped, setStripped] = useState<Blob | null>(null);

  const handle = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    setStripped(null);
    try {
      const exif = await readExif(file);
      setResult({ file, exif });
    } finally {
      setBusy(false);
    }
  };

  const strip = async () => {
    if (!result) return;
    setBusy(true);
    try {
      const bitmap = await readImageBitmap(result.file);
      const blob = await encodeImage(bitmap, {
        format: result.file.type === "image/png" ? "image/png" : "image/jpeg",
        quality: 0.95,
      });
      bitmap.close();
      setStripped(blob);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-card">
      <DropZone
        accept="image/jpeg,image/png"
        multiple={false}
        busy={busy}
        primary="Drop a JPG or PNG to inspect"
        hint="Files stay in your browser"
        onFiles={handle}
      />

      {result && (
        <>
          <div className="exif-card">
            <h3>{result.file.name}</h3>
            <p className="muted">{formatBytes(result.file.size)} · {result.file.type}</p>
            {result.exif ? (
              <table className="exif-table">
                <tbody>
                  {result.exif.make && <tr><th>Camera make</th><td>{result.exif.make}</td></tr>}
                  {result.exif.model && <tr><th>Camera model</th><td>{result.exif.model}</td></tr>}
                  {result.exif.dateTime && <tr><th>Captured</th><td>{result.exif.dateTime}</td></tr>}
                  {result.exif.exposureTime && <tr><th>Exposure</th><td>{result.exif.exposureTime}</td></tr>}
                  {result.exif.fNumber !== undefined && <tr><th>Aperture</th><td>f/{result.exif.fNumber.toFixed(1)}</td></tr>}
                  {result.exif.iso !== undefined && <tr><th>ISO</th><td>{result.exif.iso}</td></tr>}
                  {result.exif.focalLength !== undefined && <tr><th>Focal length</th><td>{result.exif.focalLength.toFixed(0)}mm</td></tr>}
                  {result.exif.width !== undefined && result.exif.height !== undefined && (
                    <tr><th>Dimensions</th><td>{result.exif.width} × {result.exif.height}</td></tr>
                  )}
                  {result.exif.orientation !== undefined && <tr><th>Orientation</th><td>{result.exif.orientation}</td></tr>}
                </tbody>
              </table>
            ) : (
              <p className="muted">No EXIF metadata found in this file.</p>
            )}
          </div>

          <div className="toolbar">
            <span className="toolbar__count">Privacy</span>
            <div className="toolbar__actions">
              <button type="button" className="btn btn--primary" onClick={strip} disabled={busy}>
                Strip metadata & download clean copy
              </button>
            </div>
          </div>

          {stripped && (
            <div className="file-row">
              <div className="file-row__main">
                <span className="file-row__name">Cleaned — {result.file.name}</span>
                <span className="badge badge--done">No metadata</span>
              </div>
              <p className="file-row__meta">
                {formatBytes(result.file.size)} → <strong>{formatBytes(stripped.size)}</strong>
              </p>
              <div className="file-row__downloads">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const ext = stripped.type === "image/png" ? "png" : "jpg";
                    downloadBlob(stripped, `${baseNameWithoutExt(result.file.name)}-clean.${ext}`);
                  }}
                >
                  Download clean copy
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
