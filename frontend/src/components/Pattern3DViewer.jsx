import React, { useRef, useEffect, useState } from "react";
import ThreeDPatternRenderer from "./ThreeDPatternRenderer";

/**
 * Pattern3DViewer - Center panel with radiation pattern visualization
 * Renders Array Geometry, Azimuth Pattern, or 3D Pattern based on viewMode
 */
export default function Pattern3DViewer({ data, loading }) {
    const canvasRef = useRef(null);
    const [viewMode, setViewMode] = useState("array-geometry");

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
            } else if (viewMode === "interference-plot" && data.interference_pattern) {
                renderInterferencePattern(ctx, canvas, data.interference_pattern, data.array_geometry, zoomLevel);
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
            case "interference-plot": return "Interference Pattern";
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
                        className={viewMode === "interference-plot" ? "mode-btn active" : "mode-btn"}
                        onClick={() => setViewMode("interference-plot")}
                    >
                        Interference Plot
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

    // Draw axis labels
    ctx.fillStyle = "#666";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("X", canvas.width - margin + 10, centerY + 4);
    ctx.fillText("Y", centerX, margin - 10);

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
 * Render spatial interference pattern (2D heatmap)
 */
function renderInterferencePattern(ctx, canvas, interferenceData, geometryData, zoom) {
    const { x_grid, y_grid, magnitude } = interferenceData;

    if (!x_grid || !y_grid || !magnitude || magnitude.length === 0) return;

    const margin = 60;
    const plotWidth = canvas.width - 2 * margin;
    const plotHeight = canvas.height - 2 * margin;

    const rows = magnitude.length;
    const cols = magnitude[0].length;

    // Get data ranges
    const xMin = x_grid[0][0];
    const xMax = x_grid[0][cols - 1];
    const yMin = y_grid[0][0];
    const yMax = y_grid[rows - 1][0];

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    // Calculate pixel size for each data point
    const pixelWidth = plotWidth / cols;
    const pixelHeight = plotHeight / rows;

    // Draw heatmap using grayscale (white = high, black = low)
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const value = magnitude[i][j];

            // Grayscale: white (1.0) to black (0.0)
            const grayValue = Math.floor(value * 255);
            ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;

            // Calculate pixel position
            const x = margin + j * pixelWidth;
            const y = canvas.height - margin - (i + 1) * pixelHeight;

            ctx.fillRect(x, y, Math.ceil(pixelWidth) + 1, Math.ceil(pixelHeight) + 1);
        }
    }

    // Draw array elements overlay if available
    if (geometryData && geometryData.elements) {
        const elements = geometryData.elements;

        elements.forEach((elem, idx) => {
            // Convert element position to canvas coordinates
            const elemX_wl = elem.x / (3e8 / 1e9); // Convert to wavelengths (approximate)
            const elemY_wl = elem.y / (3e8 / 1e9);

            // Map to canvas coordinates
            const canvasX = margin + ((elemX_wl - xMin) / xRange) * plotWidth;
            const canvasY = canvas.height - margin - ((elemY_wl - yMin) / yRange) * plotHeight;

            // Check if element is within visible range
            if (canvasX >= margin && canvasX <= canvas.width - margin &&
                canvasY >= margin && canvasY <= canvas.height - margin) {

                // Draw element as cyan dot for visibility on grayscale
                ctx.fillStyle = "#00FFFF";
                ctx.strokeStyle = "#0088CC";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(canvasX, canvasY, 4, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            }
        });
    }

    // Draw axes
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(margin, margin, plotWidth, plotHeight);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    // X-axis label
    ctx.fillText("X (wavelengths)", canvas.width / 2, canvas.height - 15);

    // Y-axis label
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Y (wavelengths)", 0, 0);
    ctx.restore();

    // Draw tick marks and values
    ctx.fillStyle = "#666";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";

    // X-axis ticks
    const numXTicks = 5;
    for (let i = 0; i <= numXTicks; i++) {
        const x = margin + (i / numXTicks) * plotWidth;
        const xValue = xMin + (i / numXTicks) * xRange;

        ctx.beginPath();
        ctx.moveTo(x, canvas.height - margin);
        ctx.lineTo(x, canvas.height - margin + 5);
        ctx.stroke();

        ctx.fillText(xValue.toFixed(1), x, canvas.height - margin + 18);
    }

    // Y-axis ticks
    ctx.textAlign = "right";
    const numYTicks = 5;
    for (let i = 0; i <= numYTicks; i++) {
        const y = canvas.height - margin - (i / numYTicks) * plotHeight;
        const yValue = yMin + (i / numYTicks) * yRange;

        ctx.beginPath();
        ctx.moveTo(margin - 5, y);
        ctx.lineTo(margin, y);
        ctx.stroke();

        ctx.fillText(yValue.toFixed(1), margin - 8, y + 4);
    }

    // Draw colorbar legend
    const colorbarWidth = 20;
    const colorbarHeight = plotHeight / 2;
    const colorbarX = canvas.width - margin + 30;
    const colorbarY = margin + plotHeight / 4;

    // Draw gradient
    for (let i = 0; i < colorbarHeight; i++) {
        const value = 1.0 - (i / colorbarHeight); // Top = 1.0 (white), bottom = 0.0 (black)
        const grayValue = Math.floor(value * 255);
        ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
        ctx.fillRect(colorbarX, colorbarY + i, colorbarWidth, 1);
    }

    // Colorbar border
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.strokeRect(colorbarX, colorbarY, colorbarWidth, colorbarHeight);

    // Colorbar labels
    ctx.fillStyle = "#333";
    ctx.font = "10px Arial";
    ctx.textAlign = "left";
    ctx.fillText("1.0", colorbarX + colorbarWidth + 5, colorbarY + 4);
    ctx.fillText("0.5", colorbarX + colorbarWidth + 5, colorbarY + colorbarHeight / 2 + 4);
    ctx.fillText("0.0", colorbarX + colorbarWidth + 5, colorbarY + colorbarHeight + 4);

    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(colorbarX + colorbarWidth / 2, colorbarY - 10);
    ctx.font = "11px Arial";
    ctx.fillText("Field", 0, 0);
    ctx.restore();

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    const steeringInfo = interferenceData.steering_azimuth !== undefined
        ? ` (Steering: ${interferenceData.steering_azimuth}°)`
        : "";
    ctx.fillText(`Spatial Interference Pattern${steeringInfo}`, canvas.width / 2, 25);
}
