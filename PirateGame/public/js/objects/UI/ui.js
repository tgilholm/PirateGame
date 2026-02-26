import DebugMenu from "./debugMenu.js";
import ShopUI from "./shopUI.js";
import Minimap from "./minimap.js";
import UI_CONFIG from "./UIConfig.json" with { type: "json" };

export default class UI {
    constructor(scene) { //singleton class constructs UI elements

        this.scene = scene;

        // Top message text
        this.messageText = scene.add.text(
            scene.cameras.main.width / 2,
            20,
            "",
            {
                fontSize:        UI_CONFIG.MESSAGE_TEXT.FONT_SIZE,
                fill:            UI_CONFIG.MESSAGE_TEXT.COLOR,
                backgroundColor: UI_CONFIG.MESSAGE_TEXT.BACKGROUND
            }
        )
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(1000)
        .setVisible(false);

        // Minimap
        this.minimap = new Minimap(document.getElementById("minimap-container"));

        // Debug menu — builds its own DOM/CSS, wires X key and stats button
        this.debugMenu = new DebugMenu(scene);
        this.debugMenu.init();

        // Shop UI
        this.shopUI = new ShopUI(document.getElementById("shop-menu"));

        // Interaction prompt
        this.promptEl = document.getElementById("interaction-prompt");
    }

    initializeMarker(spawnX, spawnY, mapWidth, mapHeight) {
        this.minimap.initializeMarker(spawnX, spawnY, mapWidth, mapHeight);
    }

    updatePlayerMarker(playerX, playerY, mapWidth, mapHeight) {
        this.minimap.updatePlayerMarker(playerX, playerY, mapWidth, mapHeight);
    }

    showPrompt(text) {
        if (this.promptEl) {
            this.promptEl.textContent = text;
            this.promptEl.style.display = "block";
        }
    }

    hidePrompt() {
        if (this.promptEl) {
            this.promptEl.style.display = "none";
        }
    }

    // Called every frame to reset transient UI state
    clear() {
        this.hidePrompt();
    }

    openShop() {
        this.shopUI.open();
    }

    closeShop() {
        this.shopUI.close();
    }

    setGold(amount) {
        // placeholder for future gold display
    }
}