import InteractableModel from "./interactable-model.js";
import Model from "./model.js";

/**
 * Client-side representation of a shop. Static interactable point that players
 * approach to buy upgrades. Draws itself as a gold circle with a label.
 */
export default class ShopModel extends InteractableModel {

    /**
     * @param {Phaser.Scene} scene
     * @param {string} id
     * @param {number} x
     * @param {number} y
     * @param {import("shared/entity-config.json")["shop"]} config
     */
    constructor(scene, id, x, y, config) {
        super(scene, null, id, 'shop', x, y, 'shop', 'Use Shop', '');
        this.isInteractable = true;
        this.type = 'shop';
        this.interactRange = config.interactRange;

        const radius = config.radius;

        // Generates temp shop body texture and reuses across all shops
        const textureKey = "shop_" + radius;
        if (!scene.textures.exists(textureKey)) {
            const padding = 4;
            const size = (radius + padding) * 2;
            const cx = size / 2;
            const cy = size / 2;

            const gfx = scene.make.graphics({ x: 0, y: 0 }, false);

            // Filled gold body
            gfx.fillStyle(0xf5c542, 1);
            gfx.fillCircle(cx, cy, radius);

            // Dark-gold border
            gfx.lineStyle(3, 0x8b6914, 1);
            gfx.strokeCircle(cx, cy, radius);

            gfx.generateTexture(textureKey, size, size);
            gfx.destroy();
        }

        // Shop body sprite
        this.bodySprite = scene.add.sprite(0, 0, textureKey);
        this.add(this.bodySprite);

        // Interaction range marker (semi-transparent ring)
        this.rangeGfx = scene.add.graphics();
        this.rangeGfx.lineStyle(1, 0xffffff, 0.18);
        this.rangeGfx.strokeCircle(0, 0, config.interactRange);
        this.add(this.rangeGfx);

        // Floating label above the circle
        this.label = scene.add.text(0, -radius - 6, 'Shop', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5, 1);
        this.add(this.label);

        this.setDepth(5);
    }

    destroy() {
        this.label?.destroy();
        this.rangeGfx?.destroy();
        super.destroy();
    }
}