export default class Plank extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'plank');
        this.scene = scene;
        this.scene.add.existing(this);
        this.setDepth(100);
    }
}