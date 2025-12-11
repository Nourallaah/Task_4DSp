import React, { useRef, useEffect, useState } from "react";
import ThreeDPatternRenderer from "./ThreeDPatternRenderer";

/**
 * Pattern3DViewer - Center panel with radiation pattern visualization
 * Renders Array Geometry, Azimuth Pattern, or 3D Pattern based on viewMode
 */
export default function Pattern3DViewer({ data, loading }) {
    const canvasRef = useRef(null);
    const [viewMode, setViewMode] = useState("azimuth-pattern");

    // Interactive controls state
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [rotation, setRotation] = useState(0); // rotation angle in degrees
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (loading) {
            // Show loading state
            ctx.fillStyle = "#666";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Calculating pattern...", canvas.width / 2, canvas.height / 2);
            return;
        }

        if (!data) {
            // Show placeholder
            ctx.fillStyle = "#999";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            const title = getTitle();
            ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillText("Adjust parameters and click Calculate", canvas.width / 2, canvas.height / 2 + 10);
            return;
        }

        // Render based on view mode with zoom and rotation
        // Note: 3D pattern uses ThreeDPatternRenderer component, not canvas
        try {
            if (viewMode === "3d-pattern") {
                // 3D mode is handled by ThreeDPatternRenderer in JSX, skip canvas
                return;
            } else if (viewMode === "array-geometry" && data.array_geometry) {
                renderArrayGeometry(ctx, canvas, data.array_geometry, zoomLevel, rotation);
            } else if (viewMode === "azimuth-pattern" && data.azimuth_pattern) {
                renderAzimuthPattern(ctx, canvas, data.azimuth_pattern, zoomLevel, rotation);
            } else {
                ctx.fillStyle = "#999";
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.fillText("No data available for this view", canvas.width / 2, canvas.height / 2);
            }
        } catch (err) {
            console.error("Rendering error:", err);
            ctx.fillStyle = "#f44";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Error rendering visualization", canvas.width / 2, canvas.height / 2);
        }

    }, [data, loading, viewMode, zoomLevel, rotation]);

    // Mouse event handlers for drag rotation
    const handleMouseDown = (e) => {
        setIsDragging(true);
        const rect = canvasRef.current.getBoundingClientRect();
        setDragStart({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const deltaX = currentX - dragStart.x;

        // Update rotation based on horizontal drag
        setRotation(prev => (prev + deltaX * 0.5) % 360);
        setDragStart({
            x: currentX,
            y: e.clientY - rect.top
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Zoom controls
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.2, 3.0));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
    };

    const handleResetView = () => {
        setZoomLevel(1.0);
        setRotation(0);
    };

    // Get title based on view mode
    const getTitle = () => {
        switch (viewMode) {
            case "array-geometry": return "Array Geometry";
            case "azimuth-pattern": return "Azimuth Pattern";
            case "3d-pattern": return "3D Directivity Pattern";
            default: return "Visualization";
        }
    };

    return (
        <div className="pattern-3d-viewer">
            <div className="viewer-header">
                <h2>{getTitle()}</h2>
                <div className="view-mode-selector">
                    <button
                        className={viewMode === "array-geometry" ? "mode-btn active" : "mode-btn"}
                        onClick={() => setViewMode("array-geometry")}
                    >
                        Array Geometry
                    </button>
                    <button
                        className={viewMode === "azimuth-pattern" ? "mode-btn active" : "mode-btn"}
                        onClick={() => setViewMode("azimuth-pattern")}
                    >
                        Azimuth Pattern
                    </button>
                    <button
                        className={viewMode === "3d-pattern" ? "mode-btn active" : "mode-btn"}
                        onClick={() => setViewMode("3d-pattern")}
                    >
                        3D Pattern
                    </button>
                </div>
            </div>
            <div className="viewer-content">
                {viewMode === "3d-pattern" && data && data.pattern_3d ? (
                    <ThreeDPatternRenderer patternData={data.pattern_3d} />
                ) : (
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        style={{
                            width: "100%",
                            height: "100%",
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                )}
            </div>
            <div className="viewer-controls">
                {viewMode === "3d-pattern" ? (
                    <span style={{ fontSize: '12px', color: '#666', padding: '8px' }}>
                        🖱️ Left-click drag: Rotate • Scroll: Zoom • Right-click drag: Pan
                    </span>
                ) : (
                    <>
                        <button className="view-btn" onClick={handleZoomIn}>Zoom In (+)</button>
                        <button className="view-btn" onClick={handleZoomOut}>Zoom Out (−)</button>
                        <button className="view-btn" onClick={handleResetView}>Reset View</button>
                        <span style={{ fontSize: '11px', color: '#666', marginLeft: '10px' }}>
                            Zoom: {(zoomLevel * 100).toFixed(0)}% | Rotation: {rotation.toFixed(0)}°
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * Render array element positions
 */
function renderArrayGeometry(ctx, canvas, geometryData, zoom, rotation) {
    const { elements } = geometryData;

    if (!elements || elements.length === 0) return;

    // Find bounds
    const xs = elements.map(e => e.x);
    const ys = elements.map(e => e.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Calculate scale and offset
    const margin = 80;
    const plotWidth = canvas.width - 2 * margin;
    const plotHeight = canvas.height - 2 * margin;

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scale = Math.min(plotWidth / rangeX, plotHeight / rangeY) * 0.8 * zoom;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Apply rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-centerX, -centerY);

    // Draw axes
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, centerY);
    ctx.lineTo(canvas.width - margin, centerY);
    ctx.moveTo(centerX, margin);
    ctx.lineTo(centerX, canvas.height - margin);
    ctx.stroke();

    // Draw elements
    elements.forEach((elem, idx) => {
        const x = centerX + (elem.x - (minX + maxX) / 2) * scale;
        const y = centerY - (elem.y - (minY + maxY) / 2) * scale;

        // Draw element circle
        ctx.fillStyle = "#2196F3";
        ctx.strokeStyle = "#1976D2";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw element number
        ctx.fillStyle = "#666";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(idx + 1, x, y - 12);
    });

    ctx.restore();

    // Draw title (not rotated)
    ctx.fillStyle = "#333";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${elements.length} Element Array`, centerX, margin / 2);
}

/**
 * Render azimuth pattern (polar plot)
 */
function renderAzimuthPattern(ctx, canvas, patternData, zoom, rotation) {
    const { angles, magnitudes } = patternData;

    if (!angles || !magnitudes || angles.length === 0) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 80;
    const scaledRadius = radius * zoom;

    // Apply rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-centerX, -centerY);

    // Draw polar grid
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;

    // Circles (dB levels)
    const dbLevels = [0, -10, -20, -30];
    dbLevels.forEach((db, idx) => {
        const r = scaledRadius * (1 - Math.abs(db) / 40);
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
        ctx.stroke();

        // Label
        ctx.fillStyle = "#999";
        ctx.font = "10px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`${db} dB`, centerX - 5, centerY - r);
    });

    // Radial lines (angles)
    for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle - 90) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + scaledRadius * Math.cos(rad), centerY + scaledRadius * Math.sin(rad));
        ctx.stroke();

        // Label
        ctx.fillStyle = "#666";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        const labelR = scaledRadius + 15;
        ctx.fillText(`${angle}°`,
            centerX + labelR * Math.cos(rad),
            centerY + labelR * Math.sin(rad) + 4);
    }

    // Plot pattern
    ctx.strokeStyle = "#2196F3";
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;
    angles.forEach((angle, idx) => {
        const angleRad = (angle - 90) * Math.PI / 180;
        const mag = Math.max(magnitudes[idx], -40);
        const r = scaledRadius * (1 + mag / 40);

        const x = centerX + r * Math.cos(angleRad);
        const y = centerY + r * Math.sin(angleRad);

        if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.closePath();
    ctx.stroke();

    // Fill pattern
    ctx.fillStyle = "rgba(33, 150, 243, 0.1)";
    ctx.fill();

    ctx.restore();

    // Draw title (not rotated)
    ctx.fillStyle = "#333";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Azimuth Pattern (Steering: ${patternData.steering_angle}°)`, centerX, 25);
}

/**
 * Render 3D pattern (simplified 2D projection)
 */
function render3DPattern(ctx, canvas, patternData, zoom, rotation) {
    const { theta, phi, magnitude } = patternData;

    if (!theta || !phi || !magnitude || theta.length === 0) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = Math.min(canvas.width, canvas.height) - 120;

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("3D Radiation Pattern", centerX, 30);
    ctx.fillText(`(Az: ${patternData.steering_azimuth}°, El: ${patternData.steering_elevation}°)`, centerX, 50);

    // Apply zoom and rotation
    const radius = (size / 3) * zoom;
    const azRad = (patternData.steering_azimuth + rotation) * Math.PI / 180;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Main lobe
    ctx.fillStyle = "rgba(33, 150, 243, 0.3)";
    ctx.strokeStyle = "#2196F3";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.6, azRad, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Draw axes
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - size / 2, centerY);
    ctx.lineTo(centerX + size / 2, centerY);
    ctx.moveTo(centerX, centerY - size / 2);
    ctx.lineTo(centerX, centerY + size / 2);
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#666";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Note: Full 3D rendering requires WebGL (future enhancement)", centerX, canvas.height - 20);
}
