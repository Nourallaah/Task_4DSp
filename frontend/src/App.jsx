import React, { useState } from "react";
import ImageViewer from "./components/ImageViewer";
import MixerControls from "./components/MixerControls";
import OutputViewer from "./components/OutputViewer";
import { mix } from "./services/mixerApi";
import "./style.css"; // Assuming CSS exists

export default function App() {
  const [images, setImages] = useState([null, null, null, null]);
  const [outputs, setOutputs] = useState({ out1: null, out2: null });
  const [activeOutput, setActiveOutput] = useState("out1"); // "out1" or "out2"
  const [loading, setLoading] = useState(false);
  
  // Global params
  const [params, setParams] = useState({
    mode: "magphase",
    weights_mag: [1, 1, 1, 1], // Simplified init
    weights_phase: [0, 0, 0, 0],
    region: { 
      type: "rect", 
      x: 100, y: 100, width: 50, height: 50, 
      radius: 30, inner: true 
    }
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
      // 1. Process the TARGET output (FT Mixing with Region)
      const targetReq = {
        images_b64: images,
        mode: params.mode,
        weights_mag: params.weights_mag,
        weights_phase: params.weights_phase,
        region: params.region
      };
      
      const targetRes = await mix(targetReq);
      
      // 2. Process the OTHER output (Spatial Mixing / "Actual Photos")
      // Weights for spatial mix are usually just the magnitude weights or a separate slider
      // Here we assume spatial mix uses the magnitude weights for simplicity
      const spatialReq = {
        images_b64: images,
        mix_mode: "spatial", 
        weights_global: params.weights_mag, 
        region: params.region // Region ignored in spatial mode backend usually
      };

      const spatialRes = await mix(spatialReq);

      setOutputs(prev => {
        if(activeOutput === "out1") {
          return { out1: targetRes.output_b64, out2: spatialRes.output_b64 };
        } else {
          return { out2: targetRes.output_b64, out1: spatialRes.output_b64 };
        }
      });

    } catch (e) {
      console.error(e);
      alert("Mixing failed");
    } finally {
      setLoading(false);
    }
  }

  // Pass region info to viewers to draw the overlay
  return (
    <div className="main-window">
      {loading && <div className="progress-bar-strip">Processing...</div>}
      
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

      <div className="right-col">
        <MixerControls 
          params={params} 
          setParams={setParams} 
          onUpdate={onUpdate}
          activeOutput={activeOutput}
          setActiveOutput={setActiveOutput}
        />
        
        <div className="output-row">
          <div className={activeOutput === "out1" ? "out-container active" : "out-container"}>
             <OutputViewer label="Output 1" imageB64={outputs.out1} />
          </div>
          <div className={activeOutput === "out2" ? "out-container active" : "out-container"}>
             <OutputViewer label="Output 2" imageB64={outputs.out2} />
          </div>
        </div>
      </div>
    </div>
  );
}