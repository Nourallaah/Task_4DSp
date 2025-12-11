import React, { useRef, useState, useEffect } from "react";
import { uploadImage, getComponent } from "../services/mixerApi";
import { drawBase64ToCanvas } from "../utils/canvasUtils";

export default function ImageViewer({ id, onChangeImage, regionOverlay, defaultComponent="mag" }) {
  const [b64, setB64] = useState(null);
  const [component, setComponent] = useState(defaultComponent);
  const [bc, setBc] = useState({ b: 100, c: 100 }); // Brightness/Contrast %
  
  const origRef = useRef();
  const ftRef = useRef();
  const fileInputRef = useRef();
  const isDragging = useRef(false);
  const lastPos = useRef({x:0, y:0});

  // Load Image logic
  async function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const res = await uploadImage(file);
    setB64(res.image_b64);
    onChangeImage(id, res.image_b64);
  }

  // Draw Canvases
  useEffect(() => {
    if (b64) drawBase64ToCanvas(b64, origRef.current);
  }, [b64]);

  useEffect(() => {
    if (!b64) return;
    (async () => {
      const json = await getComponent({ 
        image_b64: b64, 
        component: component 
      });
      drawBase64ToCanvas(json.component_b64, ftRef.current);
    })();
  }, [component, b64]);

  // B/C Mouse Handlers
  function handleMouseDown(e) {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }
  
  function handleMouseMove(e) {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    
    // Drag Right -> Contrast Up
    // Drag Up -> Brightness Up
    setBc(prev => ({
      c: Math.max(0, prev.c + dx),
      b: Math.max(0, prev.b - dy)
    }));
    
    lastPos.current = { x: e.clientX, y: e.clientY };
  }

  function handleMouseUp() { isDragging.current = false; }

  // Region Style
  const regionStyle = {
    position: 'absolute',
    border: '2px dashed red',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    left: `${regionOverlay.x}px`, // Simplified mapping. 
    top: `${regionOverlay.y}px`,  // In real app, map coords to canvas scale
    width: `${regionOverlay.width}px`,
    height: `${regionOverlay.height}px`,
    pointerEvents: 'none', // Let clicks pass through to canvas
    display: regionOverlay.type === 'rect' ? 'block' : 'none'
  };

  const filterStyle = { filter: `brightness(${bc.b}%) contrast(${bc.c}%)` };

  return (
    <div 
      className="image-viewer" 
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="viewer-title">Image {id+1}</div>
      <input ref={fileInputRef} type="file" onChange={onFileChange} style={{display:'none'}} />
      
      <div className="viewer-row">
        {/* Original Image */}
        <div className="canvas-wrapper">
           <canvas ref={origRef} onDoubleClick={()=>fileInputRef.current.click()} style={filterStyle} />
           {/* Only show region on FT? Or both? Usually FT. */}
        </div>

        {/* FT Component */}
        <div className="canvas-wrapper right-col">
          <select value={component} onChange={e => setComponent(e.target.value)} onMouseDown={e=>e.stopPropagation()}>
            <option value="mag">Magnitude</option>
            <option value="phase">Phase</option>
            <option value="real">Real</option>
            <option value="imag">Imaginary</option>
          </select>
          <div style={{position:'relative'}}>
             <canvas ref={ftRef} style={filterStyle} />
             <div className="region-overlay" style={regionStyle}></div>
          </div>
        </div>
      </div>
    </div>
  );
}