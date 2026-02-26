import Parent from "./parent";

export default class Interactable extends Phaser.GameObjects.Sprite {
    /**
     * @param {Phaser.Scene} scene  - active scene
     * @param {Parent} parent  - the parent object this interactable belongs to (e.g. a ship)
     * @param {Object} data  - initialization data from the server, must include { x, y, type }
     */
    constructor(scene, parent, data) {
        super(scene, data.x, data.y, data.type);
        this.type = data.type;
        this.parent = parent;

        if (this.type === 'helm') this.setTexture('helm.png');
        if (this.type === 'cannon') this.setTexture('cannon.png');
        if (this.type === 'ladder') this.setTexture('ladder.png');

        // Add to the parent container
        parent.container.add(this);
    }
}