import React, { useRef, useEffect } from "react";

export interface SignaturePadProps {
  value?: string;
  onChange?: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange, width = 340, height = 120 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (value && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const img = new window.Image();
      img.onload = () => ctx?.drawImage(img, 0, 0, width, height);
      img.src = value;
    } else if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, width, height);
    }
  }, [value, width, height]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    } else {
      return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    }
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d");
    ctx?.beginPath();
    const { x, y } = getPos(e);
    ctx?.moveTo(x, y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d");
    const { x, y } = getPos(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    if (onChange) onChange(canvasRef.current!.toDataURL());
  };

  const end = () => {
    drawing.current = false;
    if (onChange) onChange(canvasRef.current!.toDataURL());
  };

  const clear = () => {
    const ctx = canvasRef.current!.getContext("2d");
    ctx?.clearRect(0, 0, width, height);
    if (onChange) onChange("");
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded bg-white touch-none cursor-crosshair"
        style={{ touchAction: "none" }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button type="button" className="text-xs text-blue-600 underline" onClick={clear}>Tøm</button>
    </div>
  );
};
