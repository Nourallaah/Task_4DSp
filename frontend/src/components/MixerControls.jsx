export default function MixerControls({ params, setParams, onUpdate, activeOutput, setActiveOutput, loading }) {
  
  function updateWeight(type, idx, val) {
    const arr = [...params[type]];
    arr[idx] = parseFloat(val);
    setParams({ ...params, [type]: arr });
  }

  function updateRegion(key, val) {
    setParams({ ...params, region: { ...params.region, [key]: parseInt(val) } });
  }

  return (
    <div className="mixer-controls">
      <div className="controls-header">
        <h3>Mixing Controls</h3>
        {/* NEW: Progress Bar */}
        {loading && <div className="progress-line"></div>}
      </div>

      <div className="section">
        <h4>Target Output</h4>
        <div className="output-selector">
          <label><input type="radio" checked={activeOutput === "out1"} onChange={() => setActiveOutput("out1")} /> Output 1</label>
          <label><input type="radio" checked={activeOutput === "out2"} onChange={() => setActiveOutput("out2")} /> Output 2</label>
        </div>
      </div>

      <div className="section">
        <h4>Weights</h4>
        <div className="sliders-grid">
           <div className="column">
              <span>Mag</span>
              {params.weights_mag.map((w, i) => (
                  <input key={i} type="range" min="0" max="1" step="0.1" value={w} 
                         onChange={e => updateWeight('weights_mag', i, e.target.value)} />
              ))}
           </div>
           <div className="column">
              <span>Phase</span>
               {params.weights_phase.map((w, i) => (
                  <input key={i} type="range" min="0" max="1" step="0.1" value={w} 
                         onChange={e => updateWeight('weights_phase', i, e.target.value)} />
              ))}
           </div>
        </div>
      </div>

      <div className="section">
        <h4>Region Filter</h4>
        <div className="region-controls">
          <div className="row">
            <label>X: <input type="range" max="250" value={params.region.x} onChange={e=>updateRegion('x', e.target.value)}/></label>
            <label>Y: <input type="range" max="250" value={params.region.y} onChange={e=>updateRegion('y', e.target.value)}/></label>
          </div>
          <div className="row">
            <label>W: <input type="range" max="150" value={params.region.width} onChange={e=>updateRegion('width', e.target.value)}/></label>
            <label>H: <input type="range" max="150" value={params.region.height} onChange={e=>updateRegion('height', e.target.value)}/></label>
          </div>
          <label className="checkbox-row">
              <input type="checkbox" checked={params.region.inner} 
                     onChange={e=>setParams({...params, region: {...params.region, inner: e.target.checked}})} />
              <span>Pass Inner Region</span>
          </label>
        </div>
      </div>

      <button className="update-btn" onClick={onUpdate} disabled={loading}>
        {loading ? "Processing..." : "Update Mix Result"}
      </button>
    </div>
  );
}