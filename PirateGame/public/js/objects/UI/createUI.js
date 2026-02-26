import DebugMenu from "./debugMenu.js";
import ShopUI from "./shopUI.js";
import Minimap from "./minimap.js";
import UI_CONFIG from "./UIConfig.json" with { type: "json" };

/**
 * CreateUI — UI orchestrator.
 * Constructs all UI sub-systems and exposes them as properties.
 * Contains only creation/init logic; runtime control belongs to the caller.
 *
 * Exposed members:
 *   .messageText   — Phaser text object for top-centre messages
 *   .minimap       — Minimap instance
 *   .debugMenu     — DebugMenu instance
 *   .shopUI        — ShopUI instance
 *   .promptEl      — #interaction-prompt DOM element
 */
export default class CreateUI {
    constructor(scene) {
        this.scene = scene;

        // Top message text (Phaser)
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

        // Debug menu — builds its own DOM, wires X key and stats button
        this.debugMenu = new DebugMenu(scene);
        this.debugMenu.init();

        // Shop UI — builds its own DOM and appends to document.body
        this.shopUI = new ShopUI();

        // Interaction prompt
        this.promptEl = document.getElementById("interaction-prompt");
    }
}
