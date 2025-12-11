import React, { useRef, useEffect } from "react";
import { drawBase64ToCanvas } from "../utils/canvasUtils";

export default function OutputViewer({ label, imageB64, active }) {
  const ref = useRef();
  
  useEffect(() => {
    if (imageB64) drawBase64ToCanvas(imageB64, ref.current);
  }, [imageB64]);

  return (
    <div className="viewer-card" style={{ borderColor: active ? '#007bff' : '#dee2e6', borderWidth: active ? '2px' : '1px' }}>
      <div className="viewer-header">
        <span>{label}</span>
        {active && <span style={{fontSize:'0.7rem', color:'blue'}}>TARGET</span>}
      </div>
      <div className="canvas-row">
        <div className="canvas-wrapper">
          <canvas ref={ref} />
        </div>
      </div>
    </div>
  );
}