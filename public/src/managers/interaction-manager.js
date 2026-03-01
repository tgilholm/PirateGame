import GameManager from "./game-manager";
import InputManager from "./input-manager";
import NetworkManager from "./network-manager";

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
        // Find the closest interactable object
        const player = this.gameManager.localPlayer;
        if (!player) return;

        const closest = this.gameManager.getClosestInteractable(player);

        if (closest) {
            this.network.sendInteract(closest.type, closest.id);
        }
    }

    fire() {
        this.network.sendFire();
    }
    
    release() {
        const player = this.gameManager.localPlayer;
        if (!player || !player.isSteering || !player.isUsingCannon) return;

        this.network.sendRelease();
    }
}