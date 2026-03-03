import GameManager from "./game-manager.js";

export default class UIManager {
    /**
     * 
     * @param {Phaser.Scene} scene 
     * @param {GameManager} gameManager 
     */
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;

        this.promptElement = document.getElementById('interaction-prompt');
        this.currentInteractable = null;
    }

    update() {
        const target = this.gameManager.closestInteractable;
        const player = this.gameManager.localPlayer;

        if (!player) return;

        const isInteracting = player.isSteering || player.isUsingCannon;

        if (target) {
            const item = target.item;

            if (isInteracting) {
                const prompt = item.releasePrompt || "Release";
                this.showPrompt(`[Q] ${prompt}`);
            } else {
                this.showPrompt(`[E] ${item.usePrompt}`);
            }
        } else {
            if (isInteracting) {
                this.showPrompt(`[Q] Release`);
            } else {
                this.hidePrompt();
            }
        }
    }

    hidePrompt() {
        if (this.promptElement.style.display !== 'none') {
            this.promptElement.style.display = 'none';
        }
    }

    showPrompt(promptText) {
        if (this.promptElement.textContent !== promptText) {
            this.promptElement.textContent = promptText;
        }

        if (this.promptElement.style.display !== 'block') {
            this.promptElement.style.display = 'block';
        }
    }
}