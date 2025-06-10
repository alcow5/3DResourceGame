import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gameConfig } from './src/config/gameConfig.js';
import { gameState } from './src/core/gameState.js';
import { ResourceManager } from './src/entities/ResourceManager.js';

// Scene setup
const scene = new THREE.Scene();
console.log('Scene created');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10); // Position camera higher and further back
camera.lookAt(0, 0, 0);
console.log('Camera created');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);
console.log('Renderer initialized and added to DOM');

// Camera controls
let isRotatingCamera = false;
let cameraAngle = 0;
const cameraDistance = 10;
const cameraHeight = 5;

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
let character;
let mixer; // Animation mixer
let walkAction; // Walking animation
const loader = new GLTFLoader();
console.log('Starting to load character model...');
loader.load(
    'assets/charwalk.glb',
    (gltf) => {
        console.log('Character model loaded successfully!');
        character = gltf.scene;
        character.scale.set(1, 1, 1);
        character.position.set(0, 0, 0);
        scene.add(character);

        // Set up animations
        mixer = new THREE.AnimationMixer(character);
        if (gltf.animations && gltf.animations.length > 0) {
            console.log('Found animations:', gltf.animations.map(a => a.name));
            walkAction = mixer.clipAction(gltf.animations[0]); // Use first animation
            walkAction.play();
        } else {
            console.log('No animations found in the model');
        }
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('Error loading character model:', error);
    }
);

// Initialize resource manager
const resourceManager = new ResourceManager(scene);

// Update the click handler to use ResourceManager
window.addEventListener('click', (event) => {
    if (event.button === 0) { // Left click
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        // Get all resources from the scene
        const resources = Array.from(resourceManager.resources.values());
        
        if (debugMode) {
            console.log('Checking for resource intersections...');
            console.log('Number of resources:', resources.length);
        }
        
        const intersects = raycaster.intersectObjects(resources, true); // true to check descendants
        
        if (debugMode) {
            console.log('Intersections found:', intersects.length);
        }
        
        if (intersects.length > 0) {
            // Find the parent resource group
            let resource = intersects[0].object;
            while (resource && !resourceManager.resources.has(resource.uuid)) {
                resource = resource.parent;
            }
            
            if (resource && resourceManager.resources.has(resource.uuid)) {
                if (debugMode) {
                    console.log('Clicked resource:', resource.userData.type);
                    console.log('Health:', resource.userData.health);
                }
                
                const wasDepleted = resourceManager.collectResource(resource);
                if (wasDepleted) {
                    console.log(`${resource.userData.type} was depleted`);
                }
            }
        }
    }
});

// Add a key to toggle debug mode
window.addEventListener('keydown', (event) => {
    if (event.key === 'd') {
        debugMode = !debugMode;
        // Update visibility of collision boxes
        resourceManager.resources.forEach(resource => {
            if (resource.userData.collisionBox) {
                resource.userData.collisionBox.visible = debugMode;
            }
        });
        console.log('Debug mode:', debugMode ? 'ON' : 'OFF');
    }
});

// Create resources after models are loaded
let modelsLoaded = 0;
const totalModels = 2;

function checkAllModelsLoaded() {
    modelsLoaded++;
    if (modelsLoaded === totalModels) {
        console.log('All models loaded, spawning resources...');
        resourceManager.createRandomResources();
    }
}

// Load models
loader.load('assets/tree1.glb', (gltf) => {
    console.log('Tree 1 model loaded');
    checkAllModelsLoaded();
}, 
(xhr) => {
    console.log('Tree 1 loading progress:', (xhr.loaded / xhr.total * 100) + '%');
},
(error) => {
    console.error('Error loading Tree 1:', error);
});

loader.load('assets/tree2.glb', (gltf) => {
    console.log('Tree 2 model loaded');
    checkAllModelsLoaded();
},
(xhr) => {
    console.log('Tree 2 loading progress:', (xhr.loaded / xhr.total * 100) + '%');
},
(error) => {
    console.error('Error loading Tree 2:', error);
});

// Add debug mode
let debugMode = true;

// Keyboard controls
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false
};

// Add keyboard event listeners
window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
    if (event.key === 'd') {
        debugMode = !debugMode;
        console.log('Debug mode:', debugMode ? 'ON' : 'OFF');
    }
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// Mouse event listeners for camera control
window.addEventListener('mousedown', (event) => {
    if (event.button === 2) { // Right mouse button
        isRotatingCamera = true;
    }
});

window.addEventListener('mouseup', (event) => {
    if (event.button === 2) { // Right mouse button
        isRotatingCamera = false;
    }
});

window.addEventListener('mousemove', (event) => {
    if (isRotatingCamera) {
        cameraAngle -= event.movementX * 0.01; // Adjust rotation speed as needed
    }
});

// Prevent context menu on right click
window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
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

// Add clock for animation timing
const clock = new THREE.Clock();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update animations
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }

    // Update character position if it exists
    if (character) {
        // Get camera's forward and right vectors
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0; // Keep movement on the ground plane
        cameraDirection.normalize();

        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection);
        cameraRight.normalize();

        // Calculate movement direction based on input
        const moveDirection = new THREE.Vector3(0, 0, 0);
        
        if (keys.ArrowUp || keys.w) {
            moveDirection.add(cameraDirection);
        }
        if (keys.ArrowDown || keys.s) {
            moveDirection.sub(cameraDirection);
        }
        if (keys.ArrowLeft || keys.a) {
            moveDirection.add(cameraRight);
        }
        if (keys.ArrowRight || keys.d) {
            moveDirection.sub(cameraRight);
        }

        // Normalize and apply movement
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            character.position.add(moveDirection.multiplyScalar(0.1));

            // Rotate character to face movement direction
            const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
            character.rotation.y = targetRotation;

            // Ensure walking animation is playing
            if (walkAction && !walkAction.isRunning()) {
                walkAction.play();
            }
        } else {
            // Stop walking animation when not moving
            if (walkAction && walkAction.isRunning()) {
                walkAction.stop();
            }
        }
    }

    // Update camera position to orbit around character
    if (character) {
        // Calculate camera position based on angle and distance
        const cameraX = character.position.x + Math.sin(cameraAngle) * cameraDistance;
        const cameraZ = character.position.z + Math.cos(cameraAngle) * cameraDistance;
        
        camera.position.set(
            cameraX,
            character.position.y + cameraHeight,
            cameraZ
        );
        camera.lookAt(character.position);
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the animation loop
console.log('Starting animation loop...');
animate();
console.log('Animation started');

function updateCamera() {
    // Calculate camera position using spherical coordinates
    const x = character.position.x + cameraDistance * Math.sin(cameraAngle);
    const z = character.position.z + cameraDistance * Math.cos(cameraAngle);
    camera.position.set(x, character.position.y + cameraHeight, z);
    camera.lookAt(character.position);
}

// Clean up resources when the page is unloaded
window.addEventListener('beforeunload', () => {
    // Dispose of geometries and materials
    scene.traverse((object) => {
        if (object.isMesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
    });
    
    // Clear the scene
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
    }
    
    // Clear the resource manager
    resourceManager.resources.clear();
    resourceManager.respawnQueue.clear();
}); 
