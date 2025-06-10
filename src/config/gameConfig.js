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
        defaultXpPerResource: 10 // Default XP gained per resource collected
    },

    resources: {
        basicTree: {
            health: 5,
            respawnTime: 30000, // 30 seconds
            model: 'assets/tree1.glb',
            name: 'Basic Tree',
            requiredLevel: 1,
            resourceAmount: 1,
            xpAmount: 15 // 15 XP per click
        },
        advancedTree: {
            health: 8,
            respawnTime: 45000, // 45 seconds
            model: 'assets/tree2.glb',
            name: 'Advanced Tree',
            requiredLevel: 5,
            resourceAmount: 3,
            xpAmount: 150 // 150 XP per click
        },
        rock: {
            health: 5,
            respawnTime: 45000, // 45 seconds
            model: 'assets/rock1.glb',
            name: 'Rock',
            requiredLevel: 1,
            resourceAmount: 1,
            xpAmount: 10 // 10 XP per click
        }
    }
}; 