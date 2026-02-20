//stores player inventory and handles adding/removing items
import gameState from "../managers/GameState.js";

export default class PlayerInventory {
    constructor(scene) {
        this.scene = scene;
        this.gameState = new gameState();
    }

    inventory = new Array(9).fill(null);

     addToInventory(item) {
        // Find the first empty slot (null)
        const emptySlotIndex = this.inventory.indexOf(null);
        
        if (emptySlotIndex !== -1) {
            // Add item to the first empty slot
            this.inventory[emptySlotIndex] = item;
            console.log('Added to inventory:', item);
            console.log('Current inventory:', this.inventory);
        } else {
            // Inventory is full
            console.log('Inventory is full! Cannot add:', item);
        }
    }

    removeFromInventory(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
            console.log('Removed from inventory:', item);
        } else {
            console.log('Item not found in inventory:', item);
        }
    }

    getInventory() {
        return this.inventory;
    }


}