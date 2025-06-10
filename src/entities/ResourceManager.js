import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gameConfig } from '../config/gameConfig.js';
import { gameState } from '../core/gameState.js';

export class ResourceManager {
    constructor(scene) {
        this.scene = scene;
        this.resources = new Map();
        this.respawnQueue = new Map();
        this.loader = new GLTFLoader();
    }

    getRandomPosition() {
        const { minX, maxX, minZ, maxZ } = gameConfig.resourceConfig.spawnArea;
        return new THREE.Vector3(
            Math.random() * (maxX - minX) + minX,
            0,
            Math.random() * (maxZ - minZ) + minZ
        );
    }

    createResource(type, x, y, z) {
        const resource = new THREE.Group();
        resource.position.set(x, y, z);

        // Set resource properties immediately
        resource.userData = {
            type: type,
            health: gameConfig.resources[type].health,
            maxHealth: gameConfig.resources[type].health,
            respawnTime: gameConfig.resources[type].respawnTime,
            isCollected: false
        };

        this.loader.load(
            gameConfig.resources[type].model,
            (gltf) => {
                const model = gltf.scene;
                resource.add(model);
                
                // Add collision box
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                
                // Create a visible collision box for debugging
                const collisionBox = new THREE.Mesh(
                    new THREE.BoxGeometry(size.x, size.y, size.z),
                    new THREE.MeshBasicMaterial({ 
                        color: 0xff0000,
                        wireframe: true,
                        visible: false // Start invisible, will be toggled by debug mode
                    })
                );
                collisionBox.position.copy(resource.position);
                collisionBox.position.y = size.y / 2; // Center the box vertically
                
                // Store the collision box in the resource's userData
                resource.userData.collisionBox = collisionBox;
                resource.userData.collisionBoxMesh = collisionBox;
                
                this.scene.add(collisionBox);
            },
            undefined,
            (error) => {
                console.error('Error loading resource model:', error);
            }
        );

        this.scene.add(resource);
        this.resources.set(resource.uuid, resource);
        return resource;
    }

    // Create random resources
    createRandomResources() {
        const resourceCount = 150; // Number of each resource type to create

        // Create basic trees (80% chance)
        for (let i = 0; i < resourceCount * 0.8; i++) {
            const position = this.getRandomPosition();
            this.createResource('basicTree', position.x, position.y, position.z);
        }

        // Create advanced trees (20% chance)
        for (let i = 0; i < resourceCount * 0.2; i++) {
            const position = this.getRandomPosition();
            this.createResource('advancedTree', position.x, position.y, position.z);
        }

        // Create rocks
        for (let i = 0; i < resourceCount; i++) {
            const position = this.getRandomPosition();
            this.createResource('rock', position.x, position.y, position.z);
        }
    }

    removeResource(resource) {
        // Find the root object of the model
        let rootObject = resource;
        while (rootObject.parent && rootObject.parent !== this.scene) {
            rootObject = rootObject.parent;
        }
        
        // Remove all children and their resources
        rootObject.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        
        // Remove from scene and resources array
        this.scene.remove(rootObject);
        this.resources.delete(resource.uuid);
        console.log('Resource and all its parts removed from scene');
    }

    scheduleRespawn(type, model) {
        const respawnTime = gameConfig.resources[type].respawnTime;
        const timeoutId = setTimeout(() => {
            this.createResource(type, model.position.x, model.position.y, model.position.z);
            this.respawnQueue.delete(timeoutId);
        }, respawnTime);
        
        this.respawnQueue.set(timeoutId, type);
    }

    collectResource(resource) {
        if (!resource.userData) {
            console.error('Resource has no userData:', resource);
            return false;
        }

        const type = resource.userData.type;
        if (!type) {
            console.error('Resource has no type:', resource);
            return false;
        }

        // Check if player has required level
        const requiredLevel = gameConfig.resources[type].requiredLevel;
        if (type.includes('Tree')) {
            if (gameState.skills.lumberjack.level < requiredLevel) {
                console.log(`Need Lumberjack Level ${requiredLevel} to gather from ${gameConfig.resources[type].name}`);
                return false;
            }
        } else if (type === 'rock') {
            if (gameState.skills.mining.level < requiredLevel) {
                console.log(`Need Mining Level ${requiredLevel} to gather from ${gameConfig.resources[type].name}`);
                return false;
            }
        }

        resource.userData.health = Math.max(0, resource.userData.health - 1);
        
        if (type.includes('Tree')) {
            const amount = gameConfig.resources[type].resourceAmount;
            const xpAmount = gameConfig.resources[type].xpAmount;
            gameState.addResource('wood', amount);
            gameState.addXP('lumberjack', xpAmount);
            console.log(`Gathered ${amount} wood from ${gameConfig.resources[type].name} and gained ${xpAmount} XP`);
        } else if (type === 'rock') {
            const amount = gameConfig.resources[type].resourceAmount;
            const xpAmount = gameConfig.resources[type].xpAmount;
            gameState.addResource('ore', amount);
            gameState.addXP('mining', xpAmount);
            console.log(`Gathered ${amount} ore from ${gameConfig.resources[type].name} and gained ${xpAmount} XP`);
        }
        
        if (resource.userData.health <= 0) {
            // Remove the collision box mesh
            if (resource.userData.collisionBoxMesh) {
                this.scene.remove(resource.userData.collisionBoxMesh);
            }
            this.removeResource(resource);
            return true; // Resource was depleted
        }
        return false; // Resource still has health
    }
} 