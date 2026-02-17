/**
 * Base class for physics objects. Objects in the scope of a Parent will
 * move with them- their coordinates are computed relative to the origin of the Parent.
 * Objects leaving the scope of the Parent are returned to the "world" or absolute scope.
 */
export default class Parent {
    constructor(scene, x, y) {
        this.scene = scene;
        this.container = scene.add.container(x, y); // Add the container at the specified point
        if (scene.matter && typeof scene.matter.add === 'object' && typeof scene.matter.add.gameObject === 'function') {
            scene.matter.add.gameObject(this.container);
        }
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