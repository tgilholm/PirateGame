export default class Plank extends Phaser.GameObjects.Sprite { //placeholder class for items, plank not used now but can become anything
    constructor(scene, x, y) {
        super(scene, x, y, 'plank');
        this.scene = scene;
        this.scene.add.existing(this);
        this.setDepth(100);
    }
}