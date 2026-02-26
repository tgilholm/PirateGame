/**
 * Base class for physics objects. Objects in the scope of a Parent will
 * move with them- their coordinates are computed relative to the origin of the Parent.
 * Objects leaving the scope of the Parent are returned to the "world" or absolute scope.
 */
export default class Parent {
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

    /**
    * Converts local- (ship-scope) coordinates to absolute (world-scope)
    * coordinates using RotateAround
    * @param {Number} localX - the X coordinate relative to this object
    * @param {Number} localY - the Y coordinate relative to this object
    * @returns {{x: Number, y: Number}} a Vector of x and y coordinates
    */
    toWorld(localX, localY) {
        return Phaser.Math.RotateAround(
            {
                x: this.container.x + localX, y: this.container.y + localY
            },
            this.container.x, this.container.y, this.container.rotation
        )
    }

    /**
     * Converts absolute coordinates to coordinates relative to this object
     * @param {Number} worldX - the X coordinate in world space
     * @param {Number} worldY - the Y coordinate in world space
     * @returns {{x: Number, y: Number}} the x and y coordinates relative to this object
     */
    toLocal(worldX, worldY) {
        const angle = -this.container.rotation;
        const dx = worldX - this.container.x;
        const dy = worldY - this.container.y;

        return {
            x: dx * Math.cos(angle) - dy * Math.sin(angle),
            y: dx * Math.sin(angle) + dy * Math.cos(angle)
        };
    }
}