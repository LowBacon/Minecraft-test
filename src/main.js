import { SimpleControls } from './controls.js';
import { WorldGenerator } from './world.js';
import { UIManager } from './ui.js';

// --- 1. CORE SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x78a7ff);
scene.fog = new THREE.FogExp2(0x78a7ff, 0.015);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 2. LIGHTING SYSTEM ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(40, 100, 20);
scene.add(sun);

// --- 3. CONTROLS & UI INITIALIZATION ---
const controls = new SimpleControls(camera, renderer.domElement);
scene.add(controls.getObject());

new UIManager();

// --- 4. PROCEDURAL TEXTURE GENERATOR ENGINE ---
// This function writes raw pixel color math into a canvas to create textures purely via code
function createProceduralTexture(type) {
    const size = 16; // 16x16 pixel retro resolution
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Generate noise values for a classic pixelated grid look
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let r = 0, g = 0, b = 0;
            const noise = Math.random() * 20 - 10; // Varied pixel shading

            if (type === 'grass') {
                // Mix shades of green, with dirt tinting at the bottom edges
                r = 92 + noise;
                g = 142 + noise;
                b = 50;
                if (y > 12 && Math.random() > 0.4) { // Transition to dirt base
                    r = 134 + noise; g = 96 + noise; b = 67;
                }
            } else if (type === 'dirt') {
                // Rich brown shades
                r = 134 + noise;
                g = 96 + noise;
                b = 67 + noise;
            } else if (type === 'stone') {
                // Balanced grays
                const baseGray = 115 + noise;
                r = baseGray; g = baseGray; b = baseGray;
            } else if (type === 'wood') {
                // Tree plank rings (alternating dark and light brown stripes)
                const stripe = (x % 4 === 0 || y % 4 === 0) ? -15 : 10;
                r = 160 + noise + stripe;
                g = 118 + noise + stripe;
                b = 76 + noise;
            }

            ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    // Convert canvas into a native high-speed WebGL texture structure
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter; // Keeps pixel art ultra-sharp
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return new THREE.MeshLambertMaterial({ map: texture });
}

// Generate the 4 core texture materials natively
const grassMaterial = createProceduralTexture('grass');
const dirtMaterial  = createProceduralTexture('dirt');
const stoneMaterial = createProceduralTexture('stone');
const woodMaterial  = createProceduralTexture('wood');

// Map material references to match Block Matrix integers
const materialMap = {
    1: grassMaterial, // GRASS
    2: dirtMaterial,  // DIRT
    3: stoneMaterial, // STONE
    4: woodMaterial   // WOOD
};

// --- 5. INTERSECTING CHUNK RENDERING SEQUENCE ---
const world = new WorldGenerator(scene);
world.generateData();

// Override default builder to leverage code-generated materials array map directly
const geo = new THREE.BoxGeometry(1, 1, 1);
for (let x = 0; x < world.chunkSize; x++) {
    for (let y = 0; y < world.chunkHeight; y++) {
        for (let z = 0; z < world.chunkSize; z++) {
            const type = world.matrix[x][y][z];
            if (type === world.BLOCK_TYPES.AIR) continue;

            // Run structural occlusion checking (Face Culling Optimizer)
            const left   = x > 0 ? world.matrix[x-1][y][z] : 0;
            const right  = x < world.chunkSize-1 ? world.matrix[x+1][y][z] : 0;
            const bottom = y > 0 ? world.matrix[x][y-1][z] : 0;
            const top    = y < world.chunkHeight-1 ? world.matrix[x][y+1][z] : 0;
            const front  = z < world.chunkSize-1 ? world.matrix[x][y][z+1] : 0;
            const back   = z > 0 ? world.matrix[x][y][z-1] : 0;

            if (left && right && bottom && top && front && back) continue;

            // Instantly grab texture data array without disk fetch delays
            const blockMesh = new THREE.Mesh(geo, materialMap[type]);
            blockMesh.position.set(x, y, z);
            
            blockMesh.matrixAutoUpdate = false;
            blockMesh.updateMatrix();
            scene.add(blockMesh);
        }
    }
}

// --- 6. TICK RENDER LOOP ---
const clock = new THREE.Clock();

function frame() {
    requestAnimationFrame(frame);
    
    const delta = clock.getDelta();
    controls.update(delta);
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

frame();
