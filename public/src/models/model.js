/**
    Base class for game entities
 */
export default class Model {
    constructor(scene, x, y) {
        this.scene = scene;
        this.container = scene.add.container(x, y);
        this.target = { x: x, y: y, r: 0 };
        this.graphics = scene.add.graphics();
    }


    interpolate(lInterp = 0.2) {
        // interpolate between the server data and the client data
        this.container.x = Phaser.Math.Linear(this.container.x, this.target.x, lInterp);
        this.container.y = Phaser.Math.Linear(this.container.y, this.target.y, lInterp);

        this.container.rotation = Phaser.Math.Angle.RotateTo(
            this.container.rotation,
            this.target.r,
            0.1
        );
    }


}