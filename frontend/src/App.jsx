import React, { useState } from "react";
import ImageViewer from "./components/ImageViewer";
import MixerControls from "./components/MixerControls";
import OutputViewer from "./components/OutputViewer";
import { mix } from "./services/mixerApi";
import "./mixer.css";

export default function App() {
  const [images, setImages] = useState([null, null, null, null]);
  const [outputs, setOutputs] = useState({ out1: null, out2: null });
  const [activeOutput, setActiveOutput] = useState("out1");
  const [loading, setLoading] = useState(false);

  const [params, setParams] = useState({
    mode: "magphase",
    weights_mag: [1, 1, 1, 1],
    weights_phase: [0, 0, 0, 0],
    region: { type: "rect", x: 60, y: 60, width: 50, height: 50, inner: true },
  });

  function onChangeImage(index, b64) {
    const arr = [...images];
    arr[index] = b64;
    setImages(arr);
  }

  async function onUpdate() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await mix({
        images_b64: images,
        mode: params.mode,
        weights_mag: params.weights_mag,
        weights_phase: params.weights_phase,
        region: params.region,
      });

      const newImg = res.output_b64;

      // Update ONLY the chosen output
      setOutputs((prev) =>
        activeOutput === "out1"
          ? { ...prev, out1: newImg }
          : { ...prev, out2: newImg }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-window">
      {/* LEFT: 2x2 Grid of input images */}
      <div className="left-col">
        {Array.from({ length: 4 }).map((_, i) => (
          <ImageViewer
            key={i}
            id={i}
            onChangeImage={onChangeImage}
            regionOverlay={params.region}
          />
        ))}
      </div>

      {/* RIGHT: Controls + two outputs */}
      <div className="right-col">
        <div className="controls-panel">
          <MixerControls
            params={params}
            setParams={setParams}
            onUpdate={onUpdate}
            activeOutput={activeOutput}
            setActiveOutput={setActiveOutput}
            loading={loading}
          />
        </div>

        <div className="outputs-grid">
          <OutputViewer
            label="Output 1"
            imageB64={outputs.out1}
            active={activeOutput === "out1"}
          />
          <OutputViewer
            label="Output 2"
            imageB64={outputs.out2}
            active={activeOutput === "out2"}
          />
        </div>
      </div>
    </div>
  );
}
