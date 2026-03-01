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
        inputManager.on()

    }


    interact() {
        // Find the closest interactable object
        const player = this.gameManager.localPlayer;
        if (!player) return;

        const targets = this.getNearbyTargets(player);
        const closest = targets.find(t => t.distance < 40);

        if (closest)
        {
            this.network.sendInteract(closest.type, closest.id);
        }
    }


}