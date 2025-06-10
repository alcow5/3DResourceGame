export const gameConfig = {
    // Resource configuration
    resourceConfig: {
        maxHealth: 5,
        respawnTime: 10000, // 10 seconds in milliseconds
        spawnArea: {
            minX: -50,
            maxX: 50,
            minZ: -50,
            maxZ: 50
        }
    },

    // Camera configuration
    cameraConfig: {
        initialDistance: 10,
        initialHeight: 5,
        minDistance: 3,
        maxDistance: 20,
        rotationSpeed: 0.005,
        zoomSpeed: 0.2
    },

    // Movement configuration
    movementConfig: {
        moveSpeed: 0.05,
        rotationSpeed: 0.05
    },

    // Collection configuration
    collectionConfig: {
        range: 2, // Maximum distance for resource collection
        xpPerResource: 10 // XP gained per resource collected
    },

    resources: {
        tree: {
            health: 5,
            respawnTime: 30000, // 30 seconds
            model: 'assets/tree1.glb'
        },
        rock: {
            health: 5,
            respawnTime: 45000, // 45 seconds
            model: 'assets/rock1.glb'
        }
    }
}; 