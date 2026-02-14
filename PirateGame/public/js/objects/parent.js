/**
 * Base class for physics objects. Objects in the scope of a Parent will
 * move with them- their coordinates are computed relative to the origin of the Parent.
 * Objects leaving the scope of the Parent are returned to the "world" or absolute scope.
 */
export default class Parent {
    constructor(scene, x, y, rotation = 0) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.rotation = rotation;
    }

    /**
     * Converts local- (ship-scope) coordinates to absolute (world-scope)
     * coordinates using RotateAround
     * @param {Number} localX The X coordinate relative to this object
     * @param {Number} localY The Y coordinate relative to this object
     * @returns a Vector of x and y coordinates
     */
    toWorld(localX, localY) {
        return Phaser.Math.RotateAround(
            {
                x: this.x + localX, y: this.y + localY
            },
            this.x, this.y, this.rotation
        )
    }

    /**
     * Converts absolute coordinates to coordinates relative to this object
     * @param {Number} worldX 
     * @param {Number} worldY 
     * @returns the x and y coordinates relative to this object
     */
    toLocal(worldX, worldY) {
        const angle = -this.rotation;
        const dx = worldX - this.x;
        const dy = worldY - this.y;

        return {
            x: dx * Math.cos(angle) - dy * Math.sin(angle),
            y: dx * Math.sin(angle) + dy * Math.cos(angle)
        };
    }
}