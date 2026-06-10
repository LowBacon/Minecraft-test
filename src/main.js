import { SimpleControls } from './controls.js';

// 1. Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x78a7ff); // Sky blue
scene.fog = new THREE.FogExp2(0x78a7ff, 0.03);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false }); // False keeps pixel-art sharp
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Setup Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(20, 40, 20);
scene.add(directionalLight);

// 3. Setup Controls
const controls = new SimpleControls(camera, renderer.domElement);
scene.add(controls.getObject());

// 4. Load Texture Atlas
const textureLoader = new THREE.TextureLoader();
// Make sure you have a placeholder 'atlas.png' in your root directory!
const texture = textureLoader.load('atlas.png', () => {
    renderer.render(scene, camera);
});
texture.magFilter = THREE.NearestFilter; // Crucial for clean, pixelated edges
texture.minFilter = THREE.NearestFilter;

// Create material using the loaded texture
const material = new THREE.MeshLambertMaterial({ map: texture });
const geometry = new THREE.BoxGeometry(1, 1, 1);

// 5. Generate World (16x16 chunk of blocks)
const worldSize = 16;
for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        // Calculate a simple wave height profile using Math.sin
        const height = Math.floor((Math.sin(x * 0.2) + Math.sin(z * 0.2)) * 2) + 3;
        
        for (let y = 0; y < height; y++) {
            const block = new THREE.Mesh(geometry, material);
            block.position.set(x, y, z);
            scene.add(block);
        }
    }
}

// 6. Game Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    controls.update(delta);

    renderer.render(scene, camera);
}

// Handle Window Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game loop
animate();
