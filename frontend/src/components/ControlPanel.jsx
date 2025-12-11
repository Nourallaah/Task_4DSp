import React from "react";

/**
 * ControlPanel - Left panel with all beamforming parameters
 * Matches MATLAB beamforming simulator control panel
 */
export default function ControlPanel({ params, onParamsChange, loading }) {

    const handleInputChange = (field, value) => {
        onParamsChange({ [field]: value });
    };

    return (
        <div className="control-panel">
            <div className="control-header">
                <h2>Beamforming Parameters</h2>
            </div>

            <div className="control-content">
                {/* Array Configuration Section */}
                <div className="control-section">
                    <h3>Array Configuration</h3>

                    <div className="control-group">
                        <label>Geometry Type</label>
                        <select
                            value={params.geometry}
                            onChange={(e) => handleInputChange("geometry", e.target.value)}
                        >
                            <option value="linear">Linear Array</option>
                            <option value="curved">Curved Array</option>
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Number of Elements</label>
                        <input
                            type="number"
                            value={params.numElements}
                            onChange={(e) => handleInputChange("numElements", parseInt(e.target.value))}
                            min="2"
                            max="256"
                        />
                        <input
                            type="range"
                            value={params.numElements}
                            onChange={(e) => handleInputChange("numElements", parseInt(e.target.value))}
                            min="2"
                            max="256"
                        />
                    </div>

                    <div className="control-group">
                        <label>Element Spacing (λ)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={params.elementSpacing}
                            onChange={(e) => handleInputChange("elementSpacing", parseFloat(e.target.value))}
                            min="0.1"
                            max="2"
                        />
                        <input
                            type="range"
                            step="0.1"
                            value={params.elementSpacing}
                            onChange={(e) => handleInputChange("elementSpacing", parseFloat(e.target.value))}
                            min="0.1"
                            max="2"
                        />
                    </div>

                    {params.geometry === "curved" && (
                        <div className="control-group">
                            <label>Curvature</label>
                            <input
                                type="number"
                                step="0.1"
                                value={params.curvature}
                                onChange={(e) => handleInputChange("curvature", parseFloat(e.target.value))}
                                min="0"
                                max="1"
                            />
                            <input
                                type="range"
                                step="0.1"
                                value={params.curvature}
                                onChange={(e) => handleInputChange("curvature", parseFloat(e.target.value))}
                                min="0"
                                max="1"
                            />
                        </div>
                    )}
                </div>

                {/* Frequency Section */}
                <div className="control-section">
                    <h3>Operating Frequency</h3>

                    <div className="control-group">
                        <label>Frequency (GHz)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={params.frequency / 1e9}
                            onChange={(e) => handleInputChange("frequency", parseFloat(e.target.value) * 1e9)}
                            min="0.1"
                            max="100"
                        />
                    </div>
                </div>

                {/* Beam Steering Section */}
                <div className="control-section">
                    <h3>Beam Steering</h3>

                    <div className="control-group">
                        <label>Azimuth Angle (°)</label>
                        <input
                            type="number"
                            value={params.azimuthAngle}
                            onChange={(e) => handleInputChange("azimuthAngle", parseFloat(e.target.value))}
                            min="-90"
                            max="90"
                        />
                        <input
                            type="range"
                            value={params.azimuthAngle}
                            onChange={(e) => handleInputChange("azimuthAngle", parseFloat(e.target.value))}
                            min="-90"
                            max="90"
                        />
                    </div>

                    <div className="control-group">
                        <label>Elevation Angle (°)</label>
                        <input
                            type="number"
                            value={params.elevationAngle}
                            onChange={(e) => handleInputChange("elevationAngle", parseFloat(e.target.value))}
                            min="-90"
                            max="90"
                        />
                        <input
                            type="range"
                            value={params.elevationAngle}
                            onChange={(e) => handleInputChange("elevationAngle", parseFloat(e.target.value))}
                            min="-90"
                            max="90"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
