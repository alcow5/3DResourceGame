class GameState {
    constructor() {
        this.inventory = {
            wood: 0,
            ore: 0
        };
        
        this.skills = {
            lumberjack: { level: 1, xp: 0 },
            mining: { level: 1, xp: 0 }
        };
    }

    addResource(type, amount = 1) {
        if (type === 'wood') {
            this.inventory.wood += amount;
        } else if (type === 'ore') {
            this.inventory.ore += amount;
        }
        this.updateUI();
    }

    addXP(skill, amount = 1) {
        if (this.skills[skill]) {
            this.skills[skill].xp += amount;
            // Level up logic
            if (this.skills[skill].xp >= this.skills[skill].level * 10) {
                this.skills[skill].level += 1;
                this.skills[skill].xp = 0;
            }
            this.updateUI();
        }
    }

    updateUI() {
        document.getElementById('wood-count').textContent = this.inventory.wood;
        document.getElementById('ore-count').textContent = this.inventory.ore;
        
        document.getElementById('lumberjack-level').textContent = this.skills.lumberjack.level;
        document.getElementById('lumberjack-xp').textContent = this.skills.lumberjack.xp;
        
        document.getElementById('mining-level').textContent = this.skills.mining.level;
        document.getElementById('mining-xp').textContent = this.skills.mining.xp;
    }
}

export const gameState = new GameState(); 