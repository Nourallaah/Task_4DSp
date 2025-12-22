import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * ThreeDPatternRenderer - 3D Surface Plot using Three.js
 * Renders radiation pattern as interactive 3D surface mesh
 */
export default function ThreeDPatternRenderer({ patternData }) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || !patternData) return;

        const container = containerRef.current;

        // Improved cleanup of previous scene
        if (sceneRef.current) {
            // Dispose of all scene objects
            sceneRef.current.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
                if (object.texture) {
                    object.texture.dispose();
                }
            });
            sceneRef.current.clear();
        }

        if (rendererRef.current) {
            rendererRef.current.dispose();
            if (container.contains(rendererRef.current.domElement)) {
                container.removeChild(rendererRef.current.domElement);
            }
        }

        if (controlsRef.current) {
            controlsRef.current.dispose();
        }

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xfafafa);
        sceneRef.current = scene;

        // Camera setup
        const width = container.clientWidth;
        const height = container.clientHeight;
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.set(3, 3, 3);
        camera.lookAt(0, 0, 0);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 2;
        controls.maxDistance = 10;
        controlsRef.current = controls;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Create 3D surface from pattern data
        createPatternSurface(scene, patternData);

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(1.5);
        scene.add(axesHelper);

        // Add axis labels (X, Y, Z)
        addAxisLabels(scene);

        // Add grid
        const gridHelper = new THREE.GridHelper(4, 20, 0x888888, 0xcccccc);
        scene.add(gridHelper);

        // Animation loop
        let animationId;
        function animate() {
            animationId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // Handle window resize
        const handleResize = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            controls.dispose();

            // Dispose of all scene objects
            scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
                if (object.texture) {
                    object.texture.dispose();
                }
            });

            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };

    }, [patternData]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative'
            }}
        >
            {!patternData && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#999',
                    fontSize: '14px',
                    textAlign: 'center'
                }}>
                    No 3D pattern data available
                </div>
            )}
        </div>
    );
}

/**
 * Create 3D surface mesh from pattern data
 */
function createPatternSurface(scene, patternData) {
    const { theta, phi, magnitude } = patternData;

    if (!theta || !phi || !magnitude) return;

    // Get dimensions
    const phiSteps = phi.length;
    const thetaSteps = theta[0].length;

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const indices = [];

    // Generate vertices in spherical coordinates
    for (let i = 0; i < phiSteps; i++) {
        for (let j = 0; j < thetaSteps; j++) {
            const thetaRad = theta[i][j] * Math.PI / 180;
            const phiRad = phi[i][j] * Math.PI / 180;
            const r = magnitude[i][j]; // Already normalized 0-1

            // Convert spherical to Cartesian matching backend convention
            // Backend uses: theta = polar angle from Z-axis, phi = azimuth in XY plane
            // k_vec = [sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta)]
            const x = r * Math.sin(thetaRad) * Math.cos(phiRad);
            const y = r * Math.sin(thetaRad) * Math.sin(phiRad);
            const z = r * Math.cos(thetaRad);

            vertices.push(x, y, z);

            // Color based on magnitude (blue to red gradient)
            const color = new THREE.Color();
            color.setHSL(0.6 * (1 - r), 1.0, 0.5); // Blue (high) to red (low)
            colors.push(color.r, color.g, color.b);
        }
    }

    // Create triangular faces
    for (let i = 0; i < phiSteps - 1; i++) {
        for (let j = 0; j < thetaSteps - 1; j++) {
            const a = i * thetaSteps + j;
            const b = a + thetaSteps;
            const c = a + 1;
            const d = b + 1;

            // Two triangles per quad
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    // Set geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // Create material
    const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        shininess: 30,
        transparent: true,
        opacity: 0.9
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add wireframe overlay
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0x333333,
        opacity: 0.2,
        transparent: true
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);
}

/**
 * Add text labels for X, Y, Z axes
 */
function addAxisLabels(scene) {
    const labels = [
        { text: 'X', position: [1.7, 0, 0], color: '#ff0000' },
        { text: 'Y', position: [0, 1.7, 0], color: '#00ff00' },
        { text: 'Z', position: [0, 0, 1.7], color: '#0000ff' }
    ];

    labels.forEach(({ text, position, color }) => {
        const sprite = createTextSprite(text, color);
        sprite.position.set(...position);
        scene.add(sprite);
    });
}

/**
 * Create a text sprite using canvas
 */
function createTextSprite(text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;

    // Draw text
    context.font = 'Bold 80px Arial';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 64, 64);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create sprite material
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.3, 0.3, 1);

    return sprite;
}

