import React, { useState } from "react";
import ImageViewer from "./components/ImageViewer";
import MixerControls from "./components/MixerControls";
import OutputViewer from "./components/OutputViewer";
import { mix } from "./services/mixerApi";
import "./style.css";

export default function App() {
  const [images, setImages] = useState([null, null, null, null]);
  const [outputs, setOutputs] = useState({ out1: null, out2: null });
  const [activeOutput, setActiveOutput] = useState("out1"); 
  const [loading, setLoading] = useState(false);
  
  const [params, setParams] = useState({
    mode: "magphase",
    weights_mag: [1, 1, 1, 1],
    weights_phase: [0, 0, 0, 0],
    region: { type: "rect", x: 60, y: 60, width: 50, height: 50, inner: true }
  });

  function onChangeImage(i, b64) {
    const arr = [...images];
    arr[i] = b64;
    setImages(arr);
  }

  async function onUpdate() {
    if(loading) return;
    setLoading(true);
    try {
      // 1. Target Output (FT Mixed)
      const targetRes = await mix({
        images_b64: images,
        mode: params.mode,
        weights_mag: params.weights_mag,
        weights_phase: params.weights_phase,
        region: params.region
      });
      
      // 2. Secondary Output (Spatial/Photo Mixed)
      const spatialRes = await mix({
        images_b64: images,
        mix_mode: "spatial", 
        weights_global: params.weights_mag,
        region: params.region 
      });

      setOutputs(prev => activeOutput === "out1" 
        ? { out1: targetRes.output_b64, out2: spatialRes.output_b64 }
        : { out2: targetRes.output_b64, out1: spatialRes.output_b64 }
      );

    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }

  return (
    <div className="main-window">
      {/* LEFT: 2x2 Grid */}
      <div className="left-col">
        {Array.from({length:4}).map((_,i)=>(
          <ImageViewer 
            key={i} 
            id={i} 
            onChangeImage={onChangeImage}
            regionOverlay={params.region} 
          />
        ))}
      </div>

      {/* RIGHT: Controls Top, Outputs Bottom */}
      <div className="right-col">
        <div className="controls-panel">
          <MixerControls 
            params={params} setParams={setParams} 
            onUpdate={onUpdate}
            activeOutput={activeOutput} setActiveOutput={setActiveOutput}
            loading={loading}
          />
        </div>
        
        <div className="outputs-grid">
          <OutputViewer label="Output 1" imageB64={outputs.out1} active={activeOutput==="out1"} />
          <OutputViewer label="Output 2" imageB64={outputs.out2} active={activeOutput==="out2"} />
        </div>
      </div>
    </div>
  );
}