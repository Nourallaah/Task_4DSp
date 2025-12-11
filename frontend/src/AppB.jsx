import React, { useState, useEffect } from "react";
import ControlPanel from "./components/ControlPanel";
import Pattern3DViewer from "./components/Pattern3DViewer";
import StatsPanel from "./components/StatsPanel";
import { calculateAllVisualizations, loadScenarioPreset } from "./services/beamformingApi";
import "./style.css";

export default function AppB() {
    // State for beamforming parameters
    const [params, setParams] = useState({
        // Array configuration
        numElements: 8,
        elementSpacing: 0.5, // in wavelengths
        frequency: 1e9, // Hz
        geometry: "linear", // "linear" or "curved"
        curvature: 0, // for curved arrays

        // Beam steering
        azimuthAngle: 0,
        elevationAngle: 0,

        // Delays/weights
        delays: Array(8).fill(0),
        weights: Array(8).fill(1),
    });

    const [visualizationData, setVisualizationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Update parameters
    const updateParams = (newParams) => {
        setParams(prev => ({ ...prev, ...newParams }));
    };

    // Auto-update visualization when parameters change (with debouncing)
    useEffect(() => {
        const timer = setTimeout(() => {
            handleCalculate();
        }, 500); // 500ms debounce - waits for user to finish adjusting

        return () => clearTimeout(timer);
    }, [params.numElements, params.elementSpacing, params.frequency,
    params.geometry, params.curvature, params.azimuthAngle, params.elevationAngle]);

    // Calculate and update visualization
    const handleCalculate = async () => {
        setLoading(true);
        setError(null);

        try {
            // Prepare request payload
            const request = {
                array_config: {
                    num_elements: params.numElements,
                    element_spacing: params.elementSpacing,
                    frequency: params.frequency,
                    array_type: params.geometry,
                    curvature: params.curvature
                },
                azimuth_angle: params.azimuthAngle,
                elevation_angle: params.elevationAngle
            };

            console.log("Sending request:", request);

            // Call backend API
            const data = await calculateAllVisualizations(request);

            console.log("Received data:", data);
            setVisualizationData(data);

        } catch (err) {
            console.error("Calculation error:", err);
            setError(err.message || "Failed to calculate beam pattern");
        } finally {
            setLoading(false);
        }
    };

    // Load scenario preset
    const handleLoadScenario = async (presetName) => {
        setLoading(true);
        setError(null);

        try {
            console.log("Loading scenario:", presetName);
            const scenarioData = await loadScenarioPreset(presetName);

            console.log("Loaded scenario:", scenarioData);

            // Update params with scenario data
            updateParams({
                numElements: scenarioData.num_elements,
                frequency: scenarioData.frequency,
                geometry: scenarioData.array_type,
                curvature: scenarioData.array_type === "curved" ? 0.2 : 0,
                azimuthAngle: 0,      // Reset to default
                elevationAngle: 0     // Reset to default
            });

            // Automatically calculate after loading
            setTimeout(() => handleCalculate(), 100);

        } catch (err) {
            console.error("Load scenario error:", err);
            setError(err.message || "Failed to load scenario");
            setLoading(false);
        }
    };

    // Reset to default configuration
    const handleResetToDefault = () => {
        // Reset to initial default values
        updateParams({
            numElements: 8,
            elementSpacing: 0.5,
            frequency: 1e9,
            geometry: "linear",
            curvature: 0,
            azimuthAngle: 0,
            elevationAngle: 0
        });

        // Automatically recalculate with default values
        setTimeout(() => handleCalculate(), 100);
    };

    return (
        <div className="matlab-layout">
            {/* Left Panel - Control Panel */}
            <div className="left-panel">
                <ControlPanel
                    params={params}
                    onParamsChange={updateParams}
                    onCalculate={handleCalculate}
                    loading={loading}
                />
                {error && (
                    <div className="error-message" style={{
                        padding: "10px",
                        margin: "10px",
                        background: "#ffebee",
                        border: "1px solid #f44336",
                        borderRadius: "4px",
                        color: "#c62828",
                        fontSize: "12px"
                    }}>
                        {error}
                    </div>
                )}
            </div>

            {/* Center Panel - 3D Visualization */}
            <div className="center-panel">
                <Pattern3DViewer
                    data={visualizationData}
                    loading={loading}
                />
            </div>

            {/* Right Panel - Statistics */}
            <div className="right-panel">
                <StatsPanel
                    params={params}
                    data={visualizationData}
                    onLoadScenario={handleLoadScenario}
                    onResetToDefault={handleResetToDefault}
                    loading={loading}
                />
            </div>
        </div>
    );
}
