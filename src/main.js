import { SimpleControls } from './controls.js';
import { WorldGenerator } from './world.js';
import { UIManager } from './ui.js';

// Setup core scene variables
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x78a7ff);
scene.fog = new THREE.FogExp2(0x78a7ff, 0.015);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });

// High-end resolution capping prevents high-DPI retina mobile hardware from choking
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Smooth nature lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 0.5);
sun.position.set(40, 100, 20);
scene.add(sun);

// Initialize system dependencies
const controls = new SimpleControls(camera, renderer.domElement);
scene.add(controls.getObject());

new UIManager();

const world = new WorldGenerator(scene);
world.generateData();

// Async safe texturing system
let textureMaterial = null;
const loader = new THREE.TextureLoader();

loader.load(
    'atlas.png',
    (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        textureMaterial = new THREE.MeshLambertMaterial({ map: tex });
        world.buildOptimizedMesh(textureMaterial);
    },
    undefined,
    () => {
        // ERROR FALLBACK CACHE: Runs color-backed engines safely if image fails
        console.warn("atlas.png failed to load or CORS error hit. Activating color fallback.");
        world.buildOptimizedMesh(null);
    }
);

// Clock timing loop execution
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

// Fire up engine loop
frame();
