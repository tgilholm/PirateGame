export default class Interactable extends Phaser.GameObjects.Sprite {
    constructor(scene, parent, config) {
        super(scene, config.x, config.y, config.texture);

        this.id = config.id;    // default value
        this.type = config.type;
        this.usePrompt = config.usePrompt || `Interact with ${config.type}`;
        this.releasePrompt = config.releasePrompt || `Release ${config.type}`;

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