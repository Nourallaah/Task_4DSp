import React from "react";

export default function MixerControls({ params, setParams, onUpdate, activeOutput, setActiveOutput, loading }) {

  function updateWeight(idx, val) {
    const arr = [...params.weights];
    arr[idx] = parseFloat(val);
    setParams({ ...params, weights: arr });
  }

  function updateComponent(idx, val) {
    const arr = [...params.components];
    arr[idx] = val;
    setParams({ ...params, components: arr });
  }

  function updateRegion(key, val) {
    setParams({ ...params, region: { ...params.region, [key]: parseInt(val) } });
  }

  // Toggle region functionality on/off
  function toggleRegionEnabled(enabled) {
    setParams({
      ...params,
      region: {
        ...params.region,
        enabled: enabled
      }
    });
  }

  return (
    <div className="mixer-controls">
      {/* --- Header --- */}
      <div className="controls-header compact-header">
        <h3>Mixing Controls</h3>
        {loading && <div className="progress-line"></div>}
      </div>

      {/* --- Output Selector (Segmented Style) --- */}
      <div className="section compact-section">
        <div className="output-toggle">
          <button
            className={activeOutput === "out1" ? "active" : ""}
            onClick={() => setActiveOutput("out1")}>Output 1
          </button>
          <button
            className={activeOutput === "out2" ? "active" : ""}
            onClick={() => setActiveOutput("out2")}>Output 2
          </button>
        </div>
      </div>

      {/* --- Weights & Components (Single Column Grid) --- */}
      <div className="section compact-section">
        <div className="weights-grid single-col">
          {/* Table Headers */}
          <span className="grid-head">Image</span>
          <span className="grid-head">Component</span>
          <span className="grid-head">Weight</span>

          {/* Table Rows */}
          {Array.from({ length: 4 }).map((_, i) => {
            const currentVal = params.weights[i];
            const currentComp = params.components[i];

            return (
              <React.Fragment key={i}>
                <span className="img-label">Img {i + 1}</span>

                {/* Component Selector Per Image */}
                <select
                  className="mode-select compact-select"
                  value={currentComp}
                  onChange={e => updateComponent(i, e.target.value)}
                >
                  <option value="Magnitude">Magnitude</option>
                  <option value="Phase">Phase</option>
                  <option value="Real">Real</option>
                  <option value="Imaginary">Imaginary</option>
                </select>

                {/* Single Slider */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentVal}
                  onChange={e => updateWeight(i, e.target.value)}
                  title={`Image ${i + 1} ${currentComp}: ${currentVal}`}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* --- Region Filter Section with Toggle --- */}
      <div className="section compact-section">
        <label className="checkbox-row compact-check">
          <input
            type="checkbox"
            checked={params.region.enabled}
            onChange={e => toggleRegionEnabled(e.target.checked)}
          />
          <span>Enable Region Filter</span>
        </label>

        {/* Region controls - conditionally rendered */}
        {params.region.enabled && (
          <>
            <div className="region-compact-grid">
              <div className="input-group">
                <span>X</span>
                <input
                  type="range"
                  max="250"
                  value={params.region.x}
                  onChange={e => updateRegion('x', e.target.value)}
                  disabled={!params.region.enabled}
                />
              </div>
              <div className="input-group">
                <span>Y</span>
                <input
                  type="range"
                  max="250"
                  value={params.region.y}
                  onChange={e => updateRegion('y', e.target.value)}
                  disabled={!params.region.enabled}
                />
              </div>
              <div className="input-group">
                <span>W</span>
                <input
                  type="range"
                  max="150"
                  value={params.region.width}
                  onChange={e => updateRegion('width', e.target.value)}
                  disabled={!params.region.enabled}
                />
              </div>
              <div className="input-group">
                <span>H</span>
                <input
                  type="range"
                  max="150"
                  value={params.region.height}
                  onChange={e => updateRegion('height', e.target.value)}
                  disabled={!params.region.enabled}
                />
              </div>
            </div>
            <label className="checkbox-row compact-check">
              <input
                type="checkbox"
                checked={params.region.inner}
                onChange={e => setParams({
                  ...params,
                  region: { ...params.region, inner: e.target.checked }
                })}
                disabled={!params.region.enabled}
              />
              <span>Pass Inner Region</span>
            </label>
          </>
        )}
      </div>

      {/* Button is no longer disabled on loading to allow restart */}
      <button className="update-btn compact-btn" onClick={onUpdate}>
        {loading ? "Restart Mix Request" : "Update Mix Result"}
      </button>
    </div>
  );
}