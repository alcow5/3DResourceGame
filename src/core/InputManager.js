export class InputManager {
    constructor() {
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        this.isRotating = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
            }
        });

        window.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
            }
        });

        window.addEventListener('mousedown', (event) => {
            if (event.button === 2) {
                this.startRotatingCamera();
            }
        });

        window.addEventListener('mouseup', (event) => {
            if (event.button === 2) {
                this.stopRotatingCamera();
            }
        });

        // Prevent context menu on right click
        window.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    isKeyPressed(key) {
        return this.keys[key.toLowerCase()];
    }

    isRotatingCamera() {
        return this.isRotating;
    }

    startRotatingCamera() {
        this.isRotating = true;
    }

    stopRotatingCamera() {
        this.isRotating = false;
    }
} 