import ShipModel from "./ship-model";

/**
 * Client side interactable entity. Contains prompts for user interaction.
 * Can be added to ships by adding to their containers.
 */
export default class Interactable extends Phaser.GameObjects.Sprite {

    /**
     * Builds an interactable object in the specified scene with an optional parent
     * @param {Phaser.Scene} scene the scene to add this entity to
     * @param {ShipModel | null} parent the (optional) parent ship to add this entity to
     * @param {Object} config the configuration data to create this entity from
     */
    constructor(scene, parent, config) {
        super(scene, config.x, config.y, config.texture);   // Specify start coords and texture name in .json

        this.id = config.id;    // default value
        this.type = config.type;
        this.startY = config.y;
        this.usePrompt = config.usePrompt || `Interact with ${config.type}`;
        this.releasePrompt = config.releasePrompt || `Release ${config.type}`;

        scene.add.existing(this);

        // Responds to the side of the ship this entity is on
        if (parent) {
            this.parentId = parent.id;
            this.id = `${parent.id}_${config.id}`;

            parent.add(this);

            if (this.type !== "helm") {
                if (config.y < 0) {     // "port" side- keep upright
                    this.setRotation(0);
                } else {
                    this.setRotation(Math.PI); // "starboard" - flip in Y
                }
            }
        }
    }

    /**
     * Gets the absolute coordinates of this object, ignoring any parent containers 
     * @returns the x and y coordinates of this Interactable
     */
    getWorldPosition() {
        const matrix = this.getWorldTransformMatrix();
        return { x: matrix.tx, y: matrix.ty };
    }
}