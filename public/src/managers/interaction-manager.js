import GameManager from "./game-manager.js";
import InputManager from "./input-manager.js";
import NetworkManager from "./network-manager.js";

/**
 * Owns interaction logic
 */
export default class InteractionManager {
    /**
     * 
     * @param {NetworkManager} network 
     * @param {GameManager} gameManager 
     * @param {InputManager} inputManager 
     */
    constructor(network, gameManager, inputManager) {
        this.network = network;
        this.gameManager = gameManager;
        this.inputManager = inputManager;

        // InputManager events
        inputManager.on('interact', () => this.interact());
        inputManager.on('release', () => this.release());
        inputManager.on('fire', () => this.fire());

    }


interact() {
        const target = this.gameManager.closestInteractable;
        
        if (target) {
            this.network.sendInteract({
                targetId: target.id,        // e.g. "cannon_1"
                targetType: target.type,    // e.g. "cannon"
                parentId: target.parentId   // e.g. "ship__123"
            });
        }
    }

    fire() {
        this.network.sendFire();
    }

    release() {
        this.network.sendRelease();
    }
}