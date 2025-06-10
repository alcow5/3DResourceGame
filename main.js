import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gameConfig } from './src/config/gameConfig.js';
import { gameState } from './src/core/gameState.js';
import { ResourceManager } from './src/entities/ResourceManager.js';
import { InputManager } from './src/core/InputManager.js';

// Scene setup
const scene = new THREE.Scene();
console.log('Scene created');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
console.log('Camera created');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);
console.log('Renderer initialized and added to DOM');

// Camera setup
let cameraDistance = gameConfig.cameraConfig.initialDistance;
let cameraHeight = gameConfig.cameraConfig.initialHeight;
let cameraAngle = 0;

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enableZoom = false;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2 - 0.1;
controls.minPolarAngle = 0.1;
controls.rotateSpeed = 0.3;
controls.target.set(0, 0, 0);
controls.enabled = false;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
console.log('Ambient light added');

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);
console.log('Directional light added');

// Ground texture generation
function createGrassTexture() {
    const size = 1024; // Increased resolution
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    // Base color
    context.fillStyle = '#2d5a27';
    context.fillRect(0, 0, size, size);

    // Add grass-like patterns
    for (let i = 0; i < 5000; i++) { // More strokes
        const x = Math.random() * size;
        const y = Math.random() * size;
        const length = Math.random() * 4 + 2; // Shorter strokes
        const width = Math.random() * 1 + 0.5; // Thinner strokes
        const angle = Math.random() * Math.PI * 2;
        
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.fillStyle = `rgba(76, 187, 23, ${Math.random() * 0.2})`; // More transparent
        context.fillRect(-length/2, -width/2, length, width);
        context.restore();
    }

    // Add some darker patches
    for (let i = 0; i < 100; i++) { // More patches
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = Math.random() * 10 + 5; // Smaller patches
        
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = 'rgba(0, 0, 0, 0.05)'; // More subtle
        context.fill();
    }

    return new THREE.CanvasTexture(canvas);
}

// Ground
console.log('Creating ground geometry...');
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshBasicMaterial({ 
    map: createGrassTexture(),
    side: THREE.DoubleSide
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);
console.log('Ground added to scene');

// Character setup
const characterGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
const characterMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const character = new THREE.Mesh(characterGeometry, characterMaterial);
character.position.y = 0.5; // Half height of character
scene.add(character);
console.log('Character created');

// Initialize managers
const resourceManager = new ResourceManager(scene);
const inputManager = new InputManager();

// Initialize resource manager
resourceManager.createRandomResources();

// Model loading
let treeModel, rockModel;

// Load models
const loader = new GLTFLoader();
loader.load('assets/tree1.glb', (gltf) => {
    treeModel = gltf.scene;
    // Create initial trees
    for (let i = 0; i < 5; i++) {
        resourceManager.createResource('tree', treeModel);
    }
});

loader.load('assets/rock1.glb', (gltf) => {
    rockModel = gltf.scene;
    // Create initial rocks
    for (let i = 0; i < 5; i++) {
        resourceManager.createResource('rock', rockModel);
    }
});

// Keyboard event listeners
window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase(); // Convert to lowercase for WASD
    if (inputManager.isKeyPressed(key)) {
        console.log('Key pressed:', key);
    }
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase(); // Convert to lowercase for WASD
    if (inputManager.isKeyPressed(key)) {
        console.log('Key released:', key);
    }
});

// Mouse event handlers
window.addEventListener('mousedown', (event) => {
    if (event.button === 2) { // Right mouse button
        inputManager.startRotatingCamera();
        controls.enabled = true;
    }
});

window.addEventListener('mouseup', (event) => {
    if (event.button === 2) { // Right mouse button
        inputManager.stopRotatingCamera();
        controls.enabled = false;
    }
});

window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Mouse movement handler
window.addEventListener('mousemove', (event) => {
    if (inputManager.isRotatingCamera()) {
        cameraAngle -= event.movementX * gameConfig.cameraConfig.rotationSpeed;
    }
});

// Mouse wheel handler for zoom
window.addEventListener('wheel', (event) => {
    cameraDistance = Math.max(
        gameConfig.cameraConfig.minDistance,
        Math.min(
            gameConfig.cameraConfig.maxDistance,
            cameraDistance + event.deltaY * gameConfig.cameraConfig.zoomSpeed * 0.01
        )
    );
});

// Click handler for resource collection
window.addEventListener('click', (event) => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const objectsToCheck = scene.children.filter(obj => obj !== character);
    const intersects = raycaster.intersectObjects(objectsToCheck, true);
    
    if (intersects.length > 0) {
        let clickedObject = intersects[0].object;
        while (clickedObject.parent && clickedObject.parent !== scene && !clickedObject.userData.type) {
            clickedObject = clickedObject.parent;
        }
        
        if (clickedObject.userData.type === 'tree' || clickedObject.userData.type === 'rock') {
            const resourcePosition = new THREE.Vector3();
            clickedObject.getWorldPosition(resourcePosition);
            
            const distance = character.position.distanceTo(resourcePosition);
            if (distance <= gameConfig.collectionConfig.range) {
                if (resourceManager.collectResource(clickedObject)) {
                    resourceManager.scheduleRespawn(clickedObject.userData.type, 
                        clickedObject.userData.type === 'tree' ? treeModel : rockModel);
                }
            }
        }
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Calculate camera position based on angle and distance
    const cameraX = character.position.x + Math.sin(cameraAngle) * cameraDistance;
    const cameraZ = character.position.z + Math.cos(cameraAngle) * cameraDistance;
    camera.position.set(cameraX, character.position.y + cameraHeight, cameraZ);
    camera.lookAt(character.position);
    
    // Get camera's forward and right vectors for character movement
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
    cameraRight.normalize();
    
    // Update character movement relative to camera view
    if (inputManager.isKeyPressed('w') || inputManager.isKeyPressed('ArrowUp')) {
        const moveDirection = cameraDirection.clone();
        character.position.add(moveDirection.multiplyScalar(gameConfig.movementConfig.moveSpeed));
    }
    if (inputManager.isKeyPressed('s') || inputManager.isKeyPressed('ArrowDown')) {
        const moveDirection = cameraDirection.clone();
        character.position.sub(moveDirection.multiplyScalar(gameConfig.movementConfig.moveSpeed));
    }
    if (inputManager.isKeyPressed('a') || inputManager.isKeyPressed('ArrowLeft')) {
        const moveDirection = cameraRight.clone();
        character.position.sub(moveDirection.multiplyScalar(gameConfig.movementConfig.moveSpeed));
    }
    if (inputManager.isKeyPressed('d') || inputManager.isKeyPressed('ArrowRight')) {
        const moveDirection = cameraRight.clone();
        character.position.add(moveDirection.multiplyScalar(gameConfig.movementConfig.moveSpeed));
    }
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
console.log('Animation started');

function updateCamera() {
    // Calculate camera position using spherical coordinates
    const x = character.position.x + cameraDistance * Math.sin(cameraAngle);
    const z = character.position.z + cameraDistance * Math.cos(cameraAngle);
    camera.position.set(x, character.position.y + cameraHeight, z);
    camera.lookAt(character.position);
} 
