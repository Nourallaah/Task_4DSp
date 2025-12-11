const BASE = "http://127.0.0.1:5000/api";

export async function uploadImage(file) {  // Change parameter to accept file
    const formData = new FormData();
    formData.append('file', file);  // Create FormData here
    
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

export async function mix(data) {
    const res = await fetch(`${BASE}/mix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return await res.json();
}
