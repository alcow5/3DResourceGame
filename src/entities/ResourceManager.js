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

        this.loader.load(
            gameConfig.resources[type].model,
            (gltf) => {
                resource.add(gltf.scene);
                
                // Add collision box
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const size = box.getSize(new THREE.Vector3());
                const collisionBox = new THREE.Box3(
                    new THREE.Vector3(-size.x/2, 0, -size.z/2),
                    new THREE.Vector3(size.x/2, size.y, size.z/2)
                );
                resource.userData.collisionBox = collisionBox;
            }
        );

        // Set resource properties
        resource.userData.type = type;
        resource.userData.health = gameConfig.resources[type].health;
        resource.userData.maxHealth = gameConfig.resources[type].health;
        resource.userData.respawnTime = gameConfig.resources[type].respawnTime;
        resource.userData.isCollected = false;

        this.scene.add(resource);
        this.resources.set(resource.uuid, resource);
        return resource;
    }

    // Create random resources
    createRandomResources() {
        const resourceCount = 150; // Number of each resource type to create

        // Create trees
        for (let i = 0; i < resourceCount; i++) {
            const position = this.getRandomPosition();
            this.createResource('tree', position.x, position.y, position.z);
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
        const type = resource.userData.type;
        resource.userData.health = Math.max(0, resource.userData.health - 1);
        
        if (type === 'tree') {
            gameState.addResource('wood');
            gameState.addXP('lumberjack');
        } else if (type === 'rock') {
            gameState.addResource('ore');
            gameState.addXP('mining');
        }
        
        if (resource.userData.health <= 0) {
            this.removeResource(resource);
            return true; // Resource was depleted
        }
        return false; // Resource still has health
    }
} 