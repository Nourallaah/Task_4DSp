import React, { useRef, useEffect } from "react";
import { drawBase64ToCanvas } from "../utils/canvasUtils";

export default function OutputViewer({ label, imageB64 }) {
  const ref = useRef();
  useEffect(() => {
    if (imageB64) drawBase64ToCanvas(imageB64, ref.current);
  }, [imageB64]);

  return (
    <div className="output-viewer">
      <div className="output-label">{label}</div>
      <canvas ref={ref} className="output-canvas" />
    </div>
  );
}
