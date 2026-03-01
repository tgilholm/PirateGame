export default class Interactable extends Phaser.GameObjects.Sprite {
    constructor(scene, parent, config) {
        super(scene, config.x, config.y, config.texture);

        this.id = config.id;
        this.type = config.id;
        this.usePrompt = config.usePrompt || `Interact with ${config.type}`;
        this.releasePrompt = config.releasePrompt || `Release ${config.type}`;

        scene.add.existing(this);


        if (parent) {
            this.parentId = parent.id;
            parent.add(this);
        }
    }

    getWorldPosition() {
        const matrix = this.getWorldTransformMatrix();
        return { x: matrix.tx, y: matrix.ty };
    }
}