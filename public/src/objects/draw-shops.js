
//calculated tile to pixel conversion and draws shops in correctly as directed by entities-config.json

import uiConfig from '../ui/ui-config.json' with { type: 'json' };
import entityConfig from 'shared/entity-config.json' with { type: 'json' };

export default class DrawShops {

    /**
     * @param {Phaser.Scene} scene
     * @param {number} tileWidth 
     */
    constructor(scene, tileWidth) {
        this.scene = scene;
        this.tileWidth = tileWidth;

        this.placeShops();
        this.draw();
    }

    //uses entity-config to spawn shops in correct locations, with correct properties
    placeShops() {
        const shopConfig    = entityConfig.SHOP;
        const spawns        = shopConfig.SPAWNS;
        const id            = shopConfig.id;
        const type          = shopConfig.type;
        const interactRange = shopConfig.interactRange;
        const usePrompt     = shopConfig.usePrompt;
        const releasePrompt = shopConfig.releasePrompt;
        const tileWidth     = this.tileWidth;

        //syncs pixel positions client and server side
        this.shops = spawns.map((spawn, i) => {
            const x = (spawn.X + 0.5) * tileWidth;
            const y = (spawn.Y + 0.5) * tileWidth;

            // same specifications as ship Interactable for ease
            return {
                id: id + "_" + i, // e.g. "shop_0", "shop_1", ...
                type,
                x,
                y,
                radius: uiConfig.SHOP.RADIUS,
                interactRange,
                usePrompt,
                releasePrompt,
                parentId: null,
                //use getWorldTransformMatrix() mirrored
                getWorldTransformMatrix() { return { tx: x, ty: y }; },
            };
        });
    }

    //draws shops as Phaser objects.
    draw() {
        const gfx = this.scene.add.graphics();
        gfx.setDepth(5);

        this.shops.forEach(shop => {
            //interaction range marker (for debugging)
            gfx.lineStyle(1, 0xffffff, 0.18);
            gfx.strokeCircle(shop.x, shop.y, shop.interactRange);

            //filled shop body (gold)
            gfx.fillStyle(0xf5c542, 1);
            gfx.fillCircle(shop.x, shop.y, shop.radius);

            //dark-gold border
            gfx.lineStyle(3, 0x8b6914, 1);
            gfx.strokeCircle(shop.x, shop.y, shop.radius);

            //floating label above the shop circle
            const label = uiConfig.SHOP.LABEL;
            this.scene.add.text(
                shop.x,
                shop.y - shop.radius - 6,
                label.TEXT,
                {
                    fontSize:        label.FONT_SIZE,
                    fontFamily:      label.FONT_FAMILY,
                    color:           label.COLOR,
                    stroke:          label.STROKE,
                    strokeThickness: label.STROKE_THICKNESS,
                }
            ).setOrigin(0.5, 1).setDepth(6);
        });
    }
}

