const BASE = "http://127.0.0.1:5000/api";

export async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${BASE}/upload`, {
        method: "POST",
        body: formData
    });
    
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(`Upload failed: ${res.status} - ${error.detail || res.statusText}`);
    }
    
    return await res.json();
}

export async function getComponent(data) {
    const res = await fetch(`${BASE}/component`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return await res.json();
}

export async function mix(data, signal = null) {
    const res = await fetch(`${BASE}/mix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: signal // Pass the abort signal here
    });
    
    if (!res.ok) {
        // Basic error handling wrapper
        throw new Error(`Mix failed: ${res.statusText}`);
    }

    return await res.json();
}