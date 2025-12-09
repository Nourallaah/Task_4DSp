import React, { useState } from "react";

function App() {
  const [inputSignal, setInputSignal] = useState("1,2,3,4");
  const [gain, setGain] = useState(2);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const signalArray = inputSignal.split(",").map(Number);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/mixer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputSignal: signalArray, settings: { gain } })
      });
      const data = await res.json();
      setResult(data.processed);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>FT Mixer Project</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Input Signal (comma-separated): </label>
          <input
            value={inputSignal}
            onChange={(e) => setInputSignal(e.target.value)}
          />
        </div>

        <div>
          <label>Gain: </label>
          <input
            type="number"
            value={gain}
            onChange={(e) => setGain(Number(e.target.value))}
          />
        </div>

        <button type="submit">Process Signal</button>
      </form>

      {result && (
        <div>
          <h2>Processed Signal:</h2>
          <p>{result.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

export default App;
