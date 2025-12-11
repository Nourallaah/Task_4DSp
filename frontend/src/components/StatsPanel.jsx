import React from "react";

/**
 * StatsPanel - Right panel showing statistics and parameters
 * Matches MATLAB's info panel
 */
export default function StatsPanel({ params, data, onLoadScenario, onResetToDefault, loading }) {

    // Calculate wavelength
    const wavelength = params.frequency > 0 ? (3e8 / params.frequency) : 0;
    const wavelengthMm = (wavelength * 1000).toFixed(2);

    // Calculate array aperture
    const aperture = params.elementSpacing * wavelength * (params.numElements - 1);
    const apertureMm = (aperture * 1000).toFixed(2);

    return (
        <div className="stats-panel">
            <div className="stats-header">
                <h2>Array Information</h2>
            </div>

            <div className="stats-content">
                {/* Array Parameters */}
                <div className="stats-section">
                    <h3>Array Parameters</h3>
                    <div className="stat-item">
                        <span className="stat-label">Elements:</span>
                        <span className="stat-value">{params.numElements}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Geometry:</span>
                        <span className="stat-value">{params.geometry}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Spacing:</span>
                        <span className="stat-value">{params.elementSpacing.toFixed(2)} λ</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Aperture:</span>
                        <span className="stat-value">{apertureMm} mm</span>
                    </div>
                </div>

                {/* Frequency Information */}
                <div className="stats-section">
                    <h3>Frequency Info</h3>
                    <div className="stat-item">
                        <span className="stat-label">Frequency:</span>
                        <span className="stat-value">{(params.frequency / 1e9).toFixed(2)} GHz</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Wavelength:</span>
                        <span className="stat-value">{wavelengthMm} mm</span>
                    </div>
                </div>

                {/* Beam Steering */}
                <div className="stats-section">
                    <h3>Beam Direction</h3>
                    <div className="stat-item">
                        <span className="stat-label">Azimuth:</span>
                        <span className="stat-value">{params.azimuthAngle}°</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Elevation:</span>
                        <span className="stat-value">{params.elevationAngle}°</span>
                    </div>
                </div>

                {/* Pattern Statistics (if data available) */}
                {data && (
                    <div className="stats-section">
                        <h3>Pattern Statistics</h3>
                        <div className="stat-item">
                            <span className="stat-label">Max Gain:</span>
                            <span className="stat-value">{data.maxGain || "N/A"} dB</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Beamwidth:</span>
                            <span className="stat-value">{data.beamwidth || "N/A"}°</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Side Lobe:</span>
                            <span className="stat-value">{data.sideLobeLevel || "N/A"} dB</span>
                        </div>
                    </div>
                )}

                {/* Scenario Info */}
                <div className="stats-section">
                    <h3>Scenario</h3>
                    <div className="stat-item">
                        <span className="stat-label">Type:</span>
                        <span className="stat-value">Custom</span>
                    </div>
                    <div className="stat-item">
                        <button
                            className="scenario-btn"
                            onClick={() => onLoadScenario && onLoadScenario("5g")}
                            disabled={loading}
                        >
                            Load 5G
                        </button>
                    </div>
                    <div className="stat-item">
                        <button
                            className="scenario-btn"
                            onClick={() => onLoadScenario && onLoadScenario("ultrasound")}
                            disabled={loading}
                        >
                            Load Ultrasound
                        </button>
                    </div>
                    <div className="stat-item">
                        <button
                            className="scenario-btn"
                            onClick={() => onLoadScenario && onLoadScenario("tumor_ablation")}
                            disabled={loading}
                        >
                            Load Tumor Ablation
                        </button>
                    </div>
                    <div className="stat-item">
                        <button
                            className="scenario-btn customize-btn"
                            onClick={() => onResetToDefault && onResetToDefault()}
                            disabled={loading}
                        >
                            ⚙️ Customize (Default)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
