import Parent from "./parent";

export default class Interactable extends Phaser.GameObjects.Sprite {
    /**
     * @param {Phaser.Scene} scene 
     * @param {Parent} parent 
     * @param {Object} data 
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