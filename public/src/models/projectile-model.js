export default class ProjectileModel extends Phaser.GameObjects.Sprite {
    constructor(scene, id, x, y, r) {
        super(scene, x, y, 'cannonball');
        this.scene.add.existing(this);

        this.id = id;
        this.velocity = {x: 0, y: 0}
        this.target = {x: x, y: y};
        this.setRotation(r);
        this.setDepth(90);
    }

    /**
     * Updates the client-side state of this projectile object with the data received from the server.
     * This method replaces all data in this object with the data from the server, and should
     * thus only be used when a projectile is being created for the first time
     * @param {Object} data the complete data about this projectile
     */
    syncFromServer(data) {
        this.target.x = data.x; // The coordinate to aim for in interpolation
        this.target.y = data.y;
        this.velocity.x = data.vx;
        this.velocity.y = data.vy;
    }

    /**
     * Updates the client-side state of this projectile object by changing only the fields that have been
     * changed by the server-side representation, and leaving everything else unchanged. This retains
     * the "last known" values of each.
     * @param {Object} delta the partial data from the server 
     */
    syncDelta(delta) {
        if (delta.x !== undefined) this.target.x = delta.x;
        if (delta.y !== undefined) this.target.y = delta.y;
        if (delta.vx !== undefined) this.velocity.x = delta.vx;
        if (delta.vy !== undefined) this.velocity.y = delta.vy;
    }

    /**
     * Updates this projectile from the target data. Interpolates between the projectiles's 
     * last coordinate and the target received from the server.
     * @param {number} delta the difference in time between the last update
     */
    update(delta) {
        const responseFactor = 0.075;
        const lerp = 1 - Math.pow(1 - responseFactor, delta / 16.6667);
        const deltaTime = delta / 1000;

        const predictedX = this.target.x + this.velocity.x * deltaTime;
        const predictedY = this.target.y + this.velocity.y * deltaTime;

        this.x = Phaser.Math.Linear(this.x, predictedX, lerp);
        this.y = Phaser.Math.Linear(this.y, predictedY, lerp);
    }
}