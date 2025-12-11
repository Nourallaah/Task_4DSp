/**
 * Beamforming API Service
 * Handles communication with the backend beamforming router
 */

const BASE = "http://127.0.0.1:5000/api";

/**
 * Calculate all visualizations at once
 * @param {Object} request - Beam steering request with array config and angles
 * @returns {Promise<Object>} All visualization data (array geometry, azimuth, 3D)
 */
export async function calculateAllVisualizations(request) {
    const res = await fetch(`${BASE}/beamforming/calculate-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(`Calculate all failed: ${res.status} - ${error.detail || res.statusText}`);
    }

    return await res.json();
}

/**
 * Load a scenario preset
 * @param {string} presetName - Name of preset (5g, ultrasound, tumor_ablation)
 * @returns {Promise<Object>} Loaded scenario data
 */
export async function loadScenarioPreset(presetName) {
    const res = await fetch(`${BASE}/beamforming/load-scenario/${presetName}`, {
        method: "POST"
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(`Load scenario failed: ${res.status} - ${error.detail || res.statusText}`);
    }

    return await res.json();
}

/**
 * Get list of available scenario templates
 * @returns {Promise<Object>} List of scenario templates
 */
export async function getScenarioTemplates() {
    const res = await fetch(`${BASE}/beamforming/templates`, {
        method: "GET"
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(`Get templates failed: ${res.status} - ${error.detail || res.statusText}`);
    }

    return await res.json();
}
