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
        this.ui = null;

        this.promptElement = document.getElementById('interaction-prompt');
        this.currentInteractable = null;
    }

    /** @param {import('../ui/create-ui.js').default} ui */
    setUI(ui) {
        this.ui = ui;
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
                this.showPrompt(`[Q] ${prompt}`, target, isInteracting);
            } else {
                this.showPrompt(`[E] ${item.usePrompt}`, target, isInteracting);
            }
        } else {
            if (isInteracting) {
                this.showPrompt(`[Q] Release`, target, isInteracting);
            } else {
                this.hidePrompt(target, isInteracting);
            }
        }

    }

    hidePrompt(target, isInteracting) {
        if (this.promptElement.style.display !== 'none') {
            this.promptElement.style.display = 'none';
            console.log("Prompt hidden — Target:", !!target, "Interacting:", isInteracting);
        }
    }

    showPrompt(promptText, target, isInteracting) {
        if (this.promptElement.textContent !== promptText) {
            this.promptElement.textContent = promptText;
        }

        if (this.promptElement.style.display !== 'block') {
            this.promptElement.style.display = 'block';
            console.log("Prompt shown — Target:", !!target, "Interacting:", isInteracting);
        }
    }

    updateHud() {
        if (!this.ui || !this.gameManager.localPlayer) return;
        const matrix = this.gameManager.localPlayer.getWorldTransformMatrix();
        this.ui.minimap.updateMarker(matrix.tx, matrix.ty);
        this.ui.goldCounter.update(this.gameManager.localPlayer);
    }
}