/** @typedef {{ interactRange?: number, usePrompt?: string, releasePrompt?: string }} InteractableDefaults */

export default class Interactable extends Phaser.GameObjects.Sprite {
    /**
     * @param {Phaser.Scene} scene
     * @param {*} parent
     * @param {*} config
     * @param {InteractableDefaults} defaults
     */
    constructor(scene, parent, config, defaults = {}) {
        super(scene, config.x, config.y, config.texture);

        this.id = config.id;    // default value
        this.type = config.type;
        this.startY = config.y;
        this.usePrompt = config.usePrompt ?? defaults.usePrompt;
        this.releasePrompt = config.releasePrompt ?? defaults.releasePrompt;
        this.interactRange = config.interactRange ?? defaults.interactRange;

        scene.add.existing(this);

        if (parent) {
            this.parentId = parent.id;
            this.id = `${parent.id}_${config.id}`;

            parent.add(this);

            if (this.type !== "helm") {
                if (config.y < 0) {
                    this.setRotation(0);
                } else {
                    this.setRotation(Math.PI);
                }
            }
        }
    }

    getWorldPosition() {
        const matrix = this.getWorldTransformMatrix();
        return { x: matrix.tx, y: matrix.ty };
    }
}