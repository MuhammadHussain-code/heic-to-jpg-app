import { useEffect, useRef, useState } from "react";

export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Click again to confirm",
  className = "btn btn--ghost",
  timeoutMs = 3000,
}: {
  onConfirm: () => void;
  label: string;
  confirmLabel?: string;
  className?: string;
  timeoutMs?: number;
}): React.ReactElement {
  const [armed, setArmed] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const click = () => {
    if (armed) {
      if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
      setArmed(false);
      onConfirm();
      return;
    }
    setArmed(true);
    timeoutRef.current = window.setTimeout(() => {
      setArmed(false);
      timeoutRef.current = undefined;
    }, timeoutMs);
  };

  return (
    <button
      type="button"
      className={`${className}${armed ? " btn--armed" : ""}`}
      onClick={click}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
