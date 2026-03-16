import GameManager from "./game-manager.js";

/**
 * Owns all user interface concerns. All HTML/DOM logic should be routed
 * through this class.
 */
export default class UIManager {
    /**
     * Constructs the UI manager for the specified Scene
     * @param {Phaser.Scene} scene the scene to provide UI for
     * @param {GameManager} gameManager to access the state of the game
     */
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;

        this.promptElement = document.getElementById('interaction-prompt');
        this.currentInteractable = null;
    }

    /**
     * Refreshes all UI elements shown to the player with the latest data
     */
    update() {
        const target = this.gameManager.closestInteractable;
        const player = this.gameManager.localPlayer;

        if (!player) return;

        const isInteracting = player.isSteering || player.isUsingCannon;

        if (target) {
            const item = target.entity;

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

        if (this.gameManager.playerListDirty) {

            this.updatePlayersPanelDom(this.gameManager.playerList);
            this.gameManager.playerListDirty = false;
        }
    }

    /**
     * Removes the interaction prompt from the users screen if it is being shown
     */
    hidePrompt() {
        if (this.promptElement.style.display !== 'none') {
            this.promptElement.style.display = 'none';
        }
    }

    /**
     * Shows an interaction prompt to the user
     * @param {string} promptText the text to display
     */
    showPrompt(promptText) {
        if (this.promptElement.textContent !== promptText) {
            this.promptElement.textContent = promptText;
        }

        if (this.promptElement.style.display !== 'block') {
            this.promptElement.style.display = 'block';
        }
    }


    /**
     * Takes a list of players and refreshes the "active player" list
     * @param {Object} playerList the list of players
     */
    updatePlayersPanelDom(playerList) {
        const panel = document.getElementById("players-panel");
        const list = document.getElementById("players-list");

        if (!panel || !list) return;

        panel.style.display = "block";
        const players = Array.from(playerList.values());
        players.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
        const visible = players.slice(0, 10);
        list.innerHTML = visible
            .map((p, i) => `<li>${i + 1}. ${p.username || "Anonymous"}</li>`)
            .join("");
    }
}