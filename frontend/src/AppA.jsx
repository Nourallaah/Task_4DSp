import React, { useState, useRef } from "react";
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

  // Ref to store the current AbortController
  const abortControllerRef = useRef(null);

  const [params, setParams] = useState({
    // Store component type for each image individually
    components: ["Magnitude", "Phase", "Magnitude", "Phase"],
    // Store weight for each image individually
    weights: [0, 0, 0, 0],
    region: {
      type: "rect",
      enabled: false,
      x: 60,
      y: 60,
      width: 50,
      height: 50,
      inner: true
    },
  });

  function onChangeImage(index, b64) {
    const arr = [...images];
    arr[index] = b64;
    setImages(arr);
  }

  async function onUpdate() {
    // 1. If a request is currently running, cancel it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Create a new controller for the new request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);

    try {
      const res = await mix({
        images_b64: images,
        components: params.components,
        weights: params.weights,
        region: params.region,
      }, controller.signal); // Pass the signal to the API

      const newImg = res.output_b64;

      // Update ONLY the chosen output
      setOutputs((prev) =>
        activeOutput === "out1"
          ? { ...prev, out1: newImg }
          : { ...prev, out2: newImg }
      );
    } catch (err) {
      // Ignore errors caused by aborting the request
      if (err.name === 'AbortError') {
        console.log("Previous request cancelled");
      } else {
        console.error(err);
      }
    } finally {
      // 3. Only turn off loading if THIS controller is still the active one.
      // If the user clicked Update again, the ref will have changed, 
      // so we shouldn't turn off the loading spinner for the new request.
      if (abortControllerRef.current === controller) {
        setLoading(false);
        abortControllerRef.current = null;
      }
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