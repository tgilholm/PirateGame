import GameManager from "./game-manager";

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

        if (target) {
            this.showPrompt(target.promptText);
        } else {
            this.hidePrompt();
        }
    }

    hidePrompt() {
        if (this.promptElement.style.display !== 'none') {
            this.promptElement.style.display = 'none';
        }
    }

    showPrompt(promptText) {
        if (this.promptElement.style.display !== 'block') {
            this.promptElement.textContent = promptText;
            this.promptElement.style.display = 'block';
        }
    }
}