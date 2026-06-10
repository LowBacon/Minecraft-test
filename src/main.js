import { SimpleControls } from './controls.js';
import { WorldGenerator } from './world.js';
import { UIManager } from './ui.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x78a7ff);
scene.fog = new THREE.FogExp2(0x78a7ff, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting setup
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
sunLight.position.set(10, 25, 15);
scene.add(sunLight);

// Controls
const controls = new SimpleControls(camera, renderer.domElement);
scene.add(controls.getObject());

// Load UI Manager Engine
new UIManager();

// Texture loading structure
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('atlas.png', () => { renderer.render(scene, camera); });
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
const material = new THREE.MeshLambertMaterial({ map: texture });

// Run optimized world engine generation
const world = new WorldGenerator(scene);
world.generateData();
world.buildOptimizedMesh(material);

// Animation Clock System loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    controls.update(delta);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
