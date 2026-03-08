import Model from "./model.js";

/**
 * Client-side representation of ship data. Extends model, which extends
 * Container, allowing entities to move around with and on this ship.  
 */
export default class ShipModel extends Model {

    /**
     * Creates a ship in the specified scene at the provided coordinates.
     * @param {Phaser.Scene} scene the scene to add this ship to
     * @param {string} id the id of the ship
     * @param {number} x the (absolute) x coordinate to add this ship to
     * @param {number} y the (absolute) y coordinate to add this ship to
     * @param {ShipConfig} config the config data specifying the ship's dimensions
     */
    constructor(scene, id, x, y, config) {
        super(scene, id, x, y, 'ship', 0, false);   // not static, 0 rotation
        this.dimensions = config.dimensions; // for the hull dimensions
        this.interactables = [];
        this.pilotId = null;
        this.angularVelocity = 0;
        this.swayTimer = Math.random() * 1000;  // For the random sine-wave "bobbing"

        const textureKey = `hull_${this.dimensions.height}_${this.dimensions.middleWidth}`;
        this.getHullTexture(textureKey);

        this.hullSprite = scene.add.sprite(0, 0, textureKey);

        // Calculate the centre offset
        const padding = 5;
        const offsetX = this.dimensions.sternRadius + (this.dimensions.middleWidth / 2) + padding;
        const offsetY = (this.dimensions.height / 2) + padding;
        const totalW = this.dimensions.middleWidth + this.dimensions.bowLength + this.dimensions.sternRadius + (padding * 2);
        const totalH = this.dimensions.height + (padding * 2);

        // Add the actual sprite
        this.hullSprite.setOrigin(offsetX / totalW, offsetY / totalH);
        this.add(this.hullSprite);
        this.sendToBack(this.hullSprite);

        this.setDepth(10);
    }


    /**
     * Generates the hull texture from the dimensions supplied in the config
     * if it doesn't already exist. This ensures that new ships using the same
     * dimensions as this will re-use the existing texture.
     * @param {string} textureKey the id of the texture in Phaser's texture cache
     */
    getHullTexture(textureKey)
    {
        if (this.scene.textures.exists(textureKey)) return; // already drawn once

        const { height, middleWidth, bowLength, sternRadius } = this.dimensions;
        const halfH = height / 2;
        const halfW = middleWidth / 2;
        const segments = 12;
        const padding = 5;
        const totalW = middleWidth + bowLength + sternRadius + (padding * 2);
        const totalH = height + (padding * 2);
        const offsetX = sternRadius + halfW + padding;
        const offsetY = halfH + padding;

        const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false);
        graphics.fillStyle(0x5d4037, 1);
        graphics.lineStyle(4, 0xffffff, 1);
        graphics.beginPath();

        // Stern semicircle
        for (let i = 0; i <= segments; i++) {
            const theta = (Math.PI / 2) + (i / segments) * Math.PI;
            graphics.lineTo(offsetX + (-halfW + Math.cos(theta) * sternRadius), offsetY + Math.sin(theta) * sternRadius);
        }
        // Bow Top half quadratic
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            graphics.lineTo(offsetX + (halfW + t * bowLength), offsetY + (-halfH * (1 - t * t)));
        }
        // Bow Bottom other half of the quadratic
        for (let i = segments; i >= 0; i--) {
            const t = i / segments;
            graphics.lineTo(offsetX + (halfW + t * bowLength), offsetY + (halfH * (1 - t * t)));
        }

        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
        graphics.generateTexture(textureKey, totalW, totalH);   // for re-use by other ships
        graphics.destroy(); // cleanup
    }


    /**
     * Overrides the sync method in the base class to provide this model with
     * ship-specific data from the server.
     * @param {Object} data the data from the server
     */
    sync(data) {
        super.sync(data);

        // Snap if distance has changed a lot
        if (!this.initialised || Phaser.Math.Distance.Between(this.x, this.y, data.x, data.y) > 150) {
            this.x = data.x;
            this.y = data.y;
            this.rotation = data.r;
            this.initialised = true;
        }

        if (data.av !== undefined) this.angularVelocity = data.av;
        if (data.pilotId !== undefined) this.pilotId = data.pilotId;
    }

    /**
     * Overrides the base interpRotation method to also extrapolate the rotation
     * of the ship from the angular velocity before interpolating.
     * @param {number} deltaTime the difference in time in seconds
     * @param {number} lerp the interpolation factor
     */
    interpRotation(deltaTime, lerp) {
        const predictedR = this.target.r + this.angularVelocity * deltaTime;
        const diff = Phaser.Math.Angle.Wrap(predictedR - this.rotation);
        this.rotation += diff * lerp;
    }

    /**
     * Overrides the postUpdate method from the base class to provide
     * ship-specific updates.
     * @param {number} delta the difference in time from the last update
     * @param {number} deltaTime the delta, in seconds
     * @param {number} lerp the lerp factor, calculated from the delta
     */
    postUpdate(delta, deltaTime, lerp) {
        // Move the ship up and down slightly to "bob" with the waves
        this.swayTimer += delta;
        const bobAmount = Math.sin(this.swayTimer / 1000) * 1;
        const rockAmount = Math.cos(this.swayTimer / 1500) * 0.02;

        if (this.hullSprite) {
            this.hullSprite.y = bobAmount;
            this.hullSprite.rotation = rockAmount;
        }

        this.interactables.forEach(item => {
            item.y = item.startY + bobAmount;
        });
    }

    /**
     * Destroys this container and the contained interactables.
     */
    destroy() {
        this.interactables.forEach((item) => {
            item.destroy();
        });
        super.destroy();
    }
}