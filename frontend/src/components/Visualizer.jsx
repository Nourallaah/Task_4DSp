import React, { useEffect, useRef } from "react";

/**
 * Visualizer Component
 * Renders beamforming patterns, array configurations, and signal visualizations
 */
export default function Visualizer({
    data = null,
    type = "polar",  // "polar", "rectangular", "array"
    width = 600,
    height = 400,
    title = "Beam Pattern"
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !data) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Render based on type
        switch (type) {
            case "polar":
                drawPolarPattern(ctx, data, width, height);
                break;
            case "rectangular":
                drawRectangularPattern(ctx, data, width, height);
                break;
            case "array":
                drawArrayConfiguration(ctx, data, width, height);
                break;
            default:
                drawPolarPattern(ctx, data, width, height);
        }
    }, [data, type, width, height]);

    return (
        <div className="visualizer-container">
            {title && <h3 className="visualizer-title">{title}</h3>}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{ border: "1px solid #ccc", borderRadius: "4px" }}
            />
        </div>
    );
}

/**
 * Draw polar beam pattern
 */
function drawPolarPattern(ctx, data, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    // Background
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, width, height);

    // Draw concentric circles (grid)
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
        const r = (radius * i) / 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
        ctx.stroke();
    }

    // Draw radial lines
    for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + radius * Math.cos(rad - Math.PI / 2),
            centerY + radius * Math.sin(rad - Math.PI / 2)
        );
        ctx.stroke();
    }

    // Draw angle labels
    ctx.fillStyle = "#666";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180;
        const labelRadius = radius + 20;
        const x = centerX + labelRadius * Math.cos(rad - Math.PI / 2);
        const y = centerY + labelRadius * Math.sin(rad - Math.PI / 2);
        ctx.fillText(`${angle}°`, x, y);
    }

    // Draw beam pattern
    if (data && data.angles && data.magnitudes) {
        ctx.strokeStyle = "#2196F3";
        ctx.lineWidth = 2;
        ctx.beginPath();

        const normalize = Math.max(...data.magnitudes);

        data.angles.forEach((angle, i) => {
            const magnitude = data.magnitudes[i] / normalize;
            const rad = (angle * Math.PI) / 180;
            const r = magnitude * radius;
            const x = centerX + r * Math.cos(rad - Math.PI / 2);
            const y = centerY + r * Math.sin(rad - Math.PI / 2);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.closePath();
        ctx.stroke();

        // Fill the pattern with semi-transparent color
        ctx.fillStyle = "rgba(33, 150, 243, 0.2)";
        ctx.fill();
    }

    // Draw center point
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
}

/**
 * Draw rectangular (Cartesian) pattern
 */
function drawRectangularPattern(ctx, data, width, height) {
    const padding = 50;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Background
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        const x = padding + (plotWidth * i) / 10;
        const y = padding + (plotHeight * i) / 10;

        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // Draw data
    if (data && data.x && data.y) {
        ctx.strokeStyle = "#2196F3";
        ctx.lineWidth = 2;
        ctx.beginPath();

        const xMin = Math.min(...data.x);
        const xMax = Math.max(...data.x);
        const yMin = Math.min(...data.y);
        const yMax = Math.max(...data.y);

        data.x.forEach((xVal, i) => {
            const xNorm = (xVal - xMin) / (xMax - xMin);
            const yNorm = (data.y[i] - yMin) / (yMax - yMin);

            const x = padding + xNorm * plotWidth;
            const y = height - padding - yNorm * plotHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    // Labels
    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Angle (degrees)", width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Magnitude (dB)", 0, 0);
    ctx.restore();
}

/**
 * Draw array configuration (element positions)
 */
function drawArrayConfiguration(ctx, data, width, height) {
    const padding = 60;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Background
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    // X-axis
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw array elements
    if (data && data.elements) {
        const positions = data.elements;

        // Find bounds
        const xCoords = positions.map(p => p.x || p[0]);
        const yCoords = positions.map(p => p.y || p[1]);
        const xMin = Math.min(...xCoords);
        const xMax = Math.max(...xCoords);
        const yMin = Math.min(...yCoords);
        const yMax = Math.max(...yCoords);

        const xRange = xMax - xMin || 1;
        const yRange = yMax - yMin || 1;

        // Draw each element
        positions.forEach((pos, i) => {
            const x = pos.x !== undefined ? pos.x : pos[0];
            const y = pos.y !== undefined ? pos.y : pos[1];

            const xNorm = (x - xMin) / xRange;
            const yNorm = (y - yMin) / yRange;

            const canvasX = padding + xNorm * plotWidth * 0.8 + plotWidth * 0.1;
            const canvasY = height - padding - yNorm * plotHeight * 0.8 - plotHeight * 0.1;

            // Draw element as circle
            ctx.fillStyle = "#2196F3";
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
            ctx.fill();

            // Draw element label
            ctx.fillStyle = "#666";
            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`${i + 1}`, canvasX, canvasY - 12);

            // Draw connection lines for linear array
            if (i > 0 && positions.length > 1) {
                const prevPos = positions[i - 1];
                const prevX = prevPos.x !== undefined ? prevPos.x : prevPos[0];
                const prevY = prevPos.y !== undefined ? prevPos.y : prevPos[1];

                const prevXNorm = (prevX - xMin) / xRange;
                const prevYNorm = (prevY - yMin) / yRange;

                const prevCanvasX = padding + prevXNorm * plotWidth * 0.8 + plotWidth * 0.1;
                const prevCanvasY = height - padding - prevYNorm * plotHeight * 0.8 - plotHeight * 0.1;

                ctx.strokeStyle = "#bbb";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(prevCanvasX, prevCanvasY);
                ctx.lineTo(canvasX, canvasY);
                ctx.stroke();
            }
        });
    }

    // Labels
    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("X Position", width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Y Position", 0, 0);
    ctx.restore();
}
