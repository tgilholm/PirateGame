
/**
 * Owns interaction logic
 */
export default class InteractionManager {
    constructor(scene, network, gameManager, ui, inputHandler) {
        this.scene = scene;
        this.network = network;
        this.gameManager = gameManager;
        this.ui = ui;
        this.inputHandler = inputHandler;
    }

    update(localPlayer) {
        if (this.ui.promptEl) this.ui.promptEl.style.display = "none";

        const parentId = l
    }
}