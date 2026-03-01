/**
    Base class for game entities
 */
export default class Model extends Phaser.GameObjects.Sprite{
    constructor(scene, x, y) {
        super(scene, x, y,);

        this.scene = scene;
        this.container = scene.add.container(x, y);
        this.graphics = scene.add.graphics();

        this.targetX = x;
        this.targetY = y;
        this.targetR = 0;   // initial rotation: 0
    }


    interpolate(lInterp = 0.2) {
        // interpolate between the server data and the client data
        this.container.x = Phaser.Math.Linear(this.container.x, this.targetX, lInterp);
        this.container.y = Phaser.Math.Linear(this.container.y, this.targetY, lInterp);

        this.container.rotation = Phaser.Math.Angle.RotateTo(
            this.container.rotation,
            this.targetR,
            0.1
        );
    }


}