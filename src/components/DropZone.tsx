import { useRef, useId, type ChangeEvent, type DragEvent } from "react";

export function DropZone(props: {
  accept: string;
  multiple?: boolean;
  busy?: boolean;
  hint?: string;
  primary?: string;
  onFiles: (files: File[]) => void;
}): React.ReactElement {
  const { accept, multiple = true, busy, hint, primary, onFiles } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const dragRef = useRef<HTMLButtonElement>(null);

  const handle = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFiles([...files]);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current?.classList.add("drop-zone--active");
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current?.classList.remove("drop-zone--active");
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current?.classList.remove("drop-zone--active");
    handle(e.dataTransfer.files);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handle(e.target.files);
    e.target.value = "";
  };

  return (
    <>
      <label htmlFor={inputId} className="visually-hidden">
        Select files
      </label>
      <button
        type="button"
        ref={dragRef}
        className="drop-zone"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Add files by drag and drop or file picker"
      >
        <span className="drop-zone__icon" aria-hidden>⬇</span>
        <span className="drop-zone__primary">
          {busy ? "Processing…" : (primary ?? "Drop files here")}
        </span>
        {!busy && hint && <span className="drop-zone__secondary">{hint}</span>}
      </button>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="visually-hidden"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
      />
    </>
  );
}
