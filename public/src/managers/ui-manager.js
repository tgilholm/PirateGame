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


        if (target) {

            const item = target.item;

            console.log(item.usePrompt);
            this.showPrompt(item.usePrompt);
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