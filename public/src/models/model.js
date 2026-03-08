/**
 * Base class for all client-side entities. Extends Container to allow
 * for multiple sprites in entities, such as particle effects.
 */
export default class Model extends Phaser.GameObjects.Container {

    #cachedFrame;
    #worldPos;

    /**
     * Constructs a model in the specified scene with the provided id and coordinates
     * @param {Phaser.Scene} scene the scene to add this model to 
     * @param {string} id the (unique) identifier of this model
     * @param {number} x the x coordinate of this model
     * @param {number} y the y coordinate of this model
     * @param {boolean} isStatic whether this model can move
     */
    constructor(scene, id, x, y, r = 0, isStatic = false) {
        super(scene, x, y);
        this.id = id;
        this.isStatic = isStatic;

        this.target = { x: x, y: y, r: r };   // for interpolation
        this.velocity = { x: 0, y: 0 };       // for extrapolation
        this.#cachedFrame = -1;               // private identifier
        this.#worldPos = { x: 0, y: 0 };                 // private identifier
        this.health = 0;
        this.maxHealth = 0;

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
     * Updates this model's movement, only if it is a non-static object. Otherwise,
     * invokes postUpdate(); Subclasses should override postUpdate and provide extra
     * functionality there, rather than overriding this method and calling super().
     */
    update(delta) {
        const responseFactor = 0.075;   // How fast to interpolate
        const lerp = 1 - Math.pow(1 - responseFactor, delta / 16.6667); // at 60fps
        const deltaTime = delta / 1000;

        // Don't move static objects
        if (!this.isStatic) {
            this.interpPosition(deltaTime, lerp);
            this.interpRotation(lerp);
        }


        // PostUpdate is executed regardless of this model's static state
        this.postUpdate(delta, deltaTime, lerp);
    }


    /**
     * Method used for supplying extended functionality to subclasses. This method
     * is invoked automatically by the update() method in the base class, and supplies
     * the delta and lerp factor if additional movement needs to be applied.
     * @param {number} delta the difference in time from the last update
     * @param {number} deltaTime the delta, in seconds
     * @param {number} lerp the lerp factor, calculated from the delta
     */
    postUpdate(delta, deltaTime, lerp) {
        // Deliberately left empty
    }

    /**
     * Smoothly moves the position of this model to the target coordinates.
     * This method is separated from the main update() loop so that subclasses
     * may provide additional functionality.
     * @param {number} deltaTime the difference in time, in seconds
     * @param {number} lerp the lerp factor, calculated from the delta
     */
    interpPosition(deltaTime, lerp) {
        // Extrapolate expected position using velocity and time
        const predictedX = this.target.x + this.velocity.x * deltaTime;
        const predictedY = this.target.y + this.velocity.y * deltaTime;

        // Interpolate (move smoothly) to that expected position
        this.x = Phaser.Math.Linear(this.x, predictedX, lerp);
        this.y = Phaser.Math.Linear(this.y, predictedY, lerp);
    }

    /**
     * Smoothly move the rotation of this model to the target rotation.
     * This method is separated from the main update() loop so that subclasses
     * may provide additional functionality.
     * @param {number} lerp 
     */
    interpRotation(lerp) {
        const rDiff = Phaser.Math.Angle.Wrap(this.target.r - this.rotation);
        this.rotation += rDiff * lerp;
    }


    /**
     * Returns the relative position of this model. If this model is on a parent object,
     * returns the relative coordinates. Otherwise, returns the absolute coordinates.
     */
    get relativePos() {
        return { x: this.x, y: this.y };
    }

    /**
     * Always returns the global position of this model, using a cached frame to avoid
     * excessive getWorldTransformMatrix() calls.
     */
    get worldPos() {
        const currentFrame = this.scene.game.loop.frame;
        if (this.#cachedFrame === currentFrame) {
            return this.#worldPos;
        }

        if (this.parentContainer) {
            const matrix = this.getWorldTransformMatrix();
            this.#worldPos.x = matrix.tx;
            this.#worldPos.y = matrix.ty;
        }
        else {
            this.#worldPos.x = this.x;
            this.#worldPos.y = this.y;
        }

        this.#cachedFrame = currentFrame;
        return this.#worldPos;
    }

    /**
     * Removes this object from the scene. Subclasses should override this method,
     * destroy any sprites/containers within the subclass, then invoke super.destroy();
     */
    destroy() {
        super.destroy();
    }
}