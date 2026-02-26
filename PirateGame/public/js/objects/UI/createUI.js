import DebugMenu from "./debugMenu.js";
import ShopUI from "./shopUI.js";
import Minimap from "./minimap.js";
import UI_CONFIG from "./UIConfig.json" with { type: "json" };

//Contains only creation/init logic; runtime control belongs to the caller.
export default class CreateUI {
    /**
     * @param {Phaser.Scene} scene - The active Phaser scene used to create Phaser text objects and bind keyboard input.
     */
    constructor(scene) {
        this.scene = scene;

        //top message text
        this.messageText = scene.add.text(
            scene.cameras.main.width / 2,
            20,
            "",
            {
            fontSize: UI_CONFIG.MESSAGE_TEXT.FONT_SIZE,
            fill: UI_CONFIG.MESSAGE_TEXT.COLOR,
            backgroundColor: UI_CONFIG.MESSAGE_TEXT.BACKGROUND
            }
        )
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(1000)
        .setVisible(false);

        //minimap
        this.minimap = new Minimap(document.getElementById("minimap-container"));

        //debug menu — builds its own DOM, wires X key and stats button
        this.debugMenu = new DebugMenu(scene);
        this.debugMenu.init();

        //shop UI — builds its own DOM and appends to document.body
        this.shopUI = new ShopUI();

        //interaction prompt
        this.promptEl = document.getElementById("interaction-prompt");
    }
}
