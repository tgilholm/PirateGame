/**
 * Base class for all client-side entities. Extends Container to allow
 * for multiple sprites in entities, such as particle effects.
 */
export default class Model extends Phaser.GameObjects.Container {
    /**
     * 
     * @param {Phaser.Scene} scene the scene to add this model to 
     * @param {string} id the (unique) identifier of this model
     * @param {number} x the x coordinate of this model
     * @param {number} y the y coordinate of this model
     * @param {boolean} isStatic whether this model can move
     */
    constructor(scene, id, x, y, isStatic) {
        super(scene, x, y);
        this.id = id;
        this.isStatic = isStatic

        this.target = { x: x, y: y, r: 0 };   // for interpolation
        this.velocity = { x: 0, y: 0 };       // for extrapolation

        this.scene.add.existing(this);
    }

    /**
     * Synchronises the client-side state of this Model, taking into account
     * both full- and partial-sync (delta) packets. Subclasses should invoke
     * super.sync(data); before defining additional functionality.
     * 
     * This method should be invoked whenever new data is received from the server.
     * It should not carry out any movement, it simply updates the "target" position
     * of the data, to be moved toward in the update(delta) method.
     * @param {Object} data the data from the server 
     */
    sync(data) {
        if (data.x !== undefined) this.target.x = data.x;
        if (data.y !== undefined) this.target.y = data.y;
        if (data.vx !== undefined) this.velocity.x = data.vx;
        if (data.vy !== undefined) this.velocity.y = data.vy;
        if (data.r !== undefined) this.target.r = data.r;
        if (data.health !== undefined) this.health = data.health;
        if (data.maxHealth !== undefined) this.maxHealth = data.maxHealth;
    }


    /**
     * Updates the internal state of this model, extrapolating from the target
     * data from the server and interpolating to the expected position. Subclasses
     * should call super.update(delta); before defining additional functionality.
     * 
     * This method should not receive any additional data; it is responsible
     * for predicting the next position of this model
     */
    update(delta) {
        if (this.isStatic) return;  // Don't move static objects

        const responseFactor = 0.075;   // How fast to interpolate
        const lerp = 1 - Math.pow(1 - responseFactor, delta / 16.6667); // at 60fps
        const deltaTime = delta / 1000;

        // Extrapolate expected position using velocity and time
        const predictedX = this.target.x + this.velocity.x * deltaTime;
        const predictedY = this.target.y + this.velocity.y * deltaTime;

        // Interpolate (move smoothly) to that expected position
        this.x = Phaser.Math.Linear(this.x, predictedX, lerp);
        this.y = Phaser.Math.Linear(this.y, predictedY, lerp);
    }

    /**
     * Removes this object from the scene. Subclasses should override this method,
     * destroy any sprites/containers within the subclass, then invoke super.destroy();
     */
    destroy()
    {
        super.destroy();
    }
}