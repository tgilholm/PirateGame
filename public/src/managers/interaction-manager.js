import GameManager from "./game-manager.js";
import InputManager from "./input-manager.js";
import NetworkManager from "./network-manager.js";

/**
 * Owns interaction logic
 */
export default class InteractionManager {
    /**
     * @param {NetworkManager} network
     * @param {GameManager} gameManager
     * @param {InputManager} inputManager
     * @param {import('../ui/shop-ui.js').default} shopUI
     */
    constructor(network, gameManager, inputManager, shopUI) {
        this.network = network;
        this.gameManager = gameManager;
        this.inputManager = inputManager;
        this.shopUI = shopUI;

        // InputManager events
        inputManager.on('interact', () => this.interact());
        inputManager.on('release', () => this.release());
        inputManager.on('fire', () => this.fire());

        //close shop when player leaves interaction range
        gameManager.on('shopClose', () => this.shopUI?.close());
    }


    interact() {
        const target = this.gameManager.closestInteractable;

        if (target && target.item) {
            const closest = target.item;

            //shop UI client-side
            if (closest.type === 'shop') {
                this.shopUI?.open();
                return;
            }

            //ship interactables
            console.log(closest.id, target.dist);
            this.network.sendInteract({
                targetId: closest.id,
                targetType: closest.type,
                parentId: closest.parentId,
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