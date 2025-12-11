import React, { useRef, useState, useEffect } from "react";
import { uploadImage, getComponent } from "../services/mixerApi";
import { drawBase64ToCanvas } from "../utils/canvasUtils";

export default function ImageViewer({ id, onChangeImage, regionOverlay }) {
  const [b64, setB64] = useState(null);
  const [component, setComponent] = useState("mag");
  const [uploading, setUploading] = useState(false);
  const [bc, setBc] = useState({ b: 100, c: 100 });
  
  const origRef = useRef();
  const ftRef = useRef();
  const fileInputRef = useRef();
  
  // Drag logic vars
  const isDragging = useRef(false);
  const lastPos = useRef({x:0, y:0});

  // --- Handlers ---

  async function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadImage(file);
      setB64(res.image_b64);
      onChangeImage(id, res.image_b64);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Draw Original on change
  useEffect(() => {
    if (b64 && origRef.current) {
      drawBase64ToCanvas(b64, origRef.current);
    }
  }, [b64]);

  // Draw FT on change
  useEffect(() => {
    if (!b64 || !ftRef.current) return;
    (async () => {
      try {
        const json = await getComponent({ image_b64: b64, component });
        drawBase64ToCanvas(json.component_b64, ftRef.current);
      } catch(e) { console.error(e); }
    })();
  }, [component, b64]);

  // Mouse interactions (Brightness/Contrast)
  const handleDown = (e) => { isDragging.current = true; lastPos.current = {x:e.clientX, y:e.clientY}; };
  const handleUp = () => { isDragging.current = false; };
  const handleMove = (e) => {
    if(!isDragging.current || !b64) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setBc(p => ({ c: Math.max(0, p.c + dx), b: Math.max(0, p.b - dy) }));
    lastPos.current = {x:e.clientX, y:e.clientY};
  };

  const filterStyle = { filter: `brightness(${bc.b}%) contrast(${bc.c}%)` };
  
  // Overlay Style
  const regionStyle = {
    left: `${(regionOverlay.x / 250) * 100}%`, 
    top: `${(regionOverlay.y / 250) * 100}%`,
    width: `${(regionOverlay.width / 250) * 100}%`, 
    height: `${(regionOverlay.height / 250) * 100}%`,
    display: regionOverlay.type === 'rect' ? 'block' : 'none'
  };

  return (
    <div className="viewer-card" onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp} onMouseLeave={handleUp}>
      <div className="viewer-header">
        <span>Image {id+1}</span>
        {/* Disable dropdown if no image */}
        <select disabled={!b64} value={component} onChange={e=>setComponent(e.target.value)} onMouseDown={e=>e.stopPropagation()}>
            <option value="mag">Magnitude</option><option value="phase">Phase</option>
            <option value="real">Real</option><option value="imag">Imag</option>
        </select>
      </div>
      
      <input ref={fileInputRef} type="file" onChange={onFileChange} style={{display:'none'}} />
      
      <div className="canvas-row">
        {/* --- LEFT: Original or Placeholder --- */}
        <div className="canvas-wrapper">
           {b64 ? (
             <>
               <canvas ref={origRef} onDoubleClick={()=>fileInputRef.current.click()} style={filterStyle}/>
               {uploading && <div className="loader-overlay"><div className="spinner"></div></div>}
             </>
           ) : (
             <div className="placeholder-container" onDoubleClick={()=>fileInputRef.current.click()}>
                {/* SVG Icon similar to the one requested */}
                <svg className="placeholder-icon" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <div className="placeholder-text">Double click to upload</div>
             </div>
           )}
        </div>
        
        {/* --- RIGHT: FT or Grey Empty State --- */}
        <div className="canvas-wrapper">
           {b64 ? (
             <>
               <canvas ref={ftRef} style={filterStyle}/>
               <div className="region-overlay" style={regionStyle}></div>
             </>
           ) : (
             <div className="empty-state"></div>
           )}
        </div>
      </div>
    </div>
  );
}