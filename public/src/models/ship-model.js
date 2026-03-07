/** @typedef {import("shared/entity-config.json")["ship"]} ShipConfig */

import Interactable from "./interactable.js";

/**
 * Client-side representation of ship data. Extends container to allow other 
 * game objects to move with, and independently of the ship.  
 */
export default class ShipModel extends Phaser.GameObjects.Container {

    /**
     * Creates a ship in the specified scene at the provided coordinates.
     * @param {Phaser.Scene} scene the scene to add this ship to
     * @param {string} id the id of the ship
     * @param {number} x the (absolute) x coordinate to add this ship to
     * @param {number} y the (absolute) y coordinate to add this ship to
     * @param {ShipConfig} config the config data specifying the ship's dimensions
     */
    constructor(scene, id, x, y, config) {
        super(scene, x, y);
        this.dimensions = config.dimensions; // destructure the config- we only need the hull dimensions
        this.interactables = [];
        this.id = id;

        this.target = { x: 0, y: 0, r: 0 }; // for interpolation
        this.velocity = { x: 0, y: 0 }; // for extrapolation
        this.pilotId = null;
        this.angularVelocity = 0;

        // Adds each of the interactables from the config to this ship
        if (config.interactables) {
            config.interactables.forEach(item => {
                const model = new Interactable(this.scene, this, item);
                this.interactables.push(model);
            })
        }

        this.hullSprite = null;
        this.drawHull(this.dimensions);
        this.drawInteractables();
        this.setRotation(0);
        scene.add.existing(this);
    }


    /**
     * Creates the sprite for this ship using the dimensions provided in the config file
     * @param {ShipConfig["dimensions"]} dimensions the dimensions of the ship
     */
    drawHull(dimensions) {
        if (!dimensions) return;


        const { height, middleWidth, bowLength, sternRadius } = dimensions;
        const halfH = height / 2;
        const halfW = middleWidth / 2;  // width in pixels of the middle rectangle
        const segments = 12;            // how much to subdivide the line by
        const padding = 5;
        const totalW = middleWidth + bowLength + sternRadius + (padding * 2);   // total length of the ship
        const totalH = height + (padding * 2);
        const offsetX = sternRadius + halfW + padding;
        const offsetY = halfH + padding;

        // Draw the ship with an outline, fill with brown
        const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false);
        graphics.fillStyle(0x5d4037, 1);
        graphics.lineStyle(4, 0xffffff, 1);
        graphics.beginPath();

        // Stern- draws a semi-circle 
        for (let i = 0; i <= segments; i++) {
            const theta = (Math.PI / 2) + (i / segments) * Math.PI;
            const px = offsetX + (-halfW + (Math.cos(theta) * sternRadius));
            const py = offsetY + (Math.sin(theta) * sternRadius);
            if (i === 0) graphics.moveTo(px, py);
            else graphics.lineTo(px, py);
        }

        // Bow top- half of the quadratic curve
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const px = offsetX + (halfW + (t * bowLength));
            const py = offsetY + (-halfH * (1 - (t * t)));
            graphics.lineTo(px, py);
        }

        // Bow bottom - other half of the quadratic curve
        for (let i = segments; i >= 0; i--) {
            const t = i / segments;
            const px = offsetX + (halfW + (t * bowLength));
            const py = offsetY + (halfH * (1 - (t * t)));
            graphics.lineTo(px, py);
        }

        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();

        // Only generate the texture if it doesn't already exist- future ships re-use this
        const textureName = 'hull';
        if (!this.scene.textures.exists(textureName)) {
            graphics.generateTexture(textureName, totalW, totalH);
        }

        if (this.hullSprite) this.hullSprite.destroy();

        // Sets the origin point of this ship to the relative centre
        this.hullSprite = this.scene.add.sprite(0, 0, textureName);
        this.hullSprite.setOrigin(offsetX / totalW, offsetY / totalH);
        this.scene.textures.get(textureName).setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.add(this.hullSprite);
        this.sendToBack(this.hullSprite);
        this.setDepth(10);

        this.swayTimer = Math.random() * 1000;  // For the random sine-wave "bobbing"
    }

    /**
     * Adds each of the interactable sprites to this container
     */
    drawInteractables() {
        this.interactables.forEach(i => {
            const item = this.add(i);
        });
    }

    /**
     * Full sync- replaces all the entity data for this ship- this should only be used when a ship
     * is created for the first time on the server, or comes into view of this player
     * @param {Object} data complete ship data
     */
    syncFromServer(data) {
        // Snap if distance has changed a lot
        if (!this.initialised || Phaser.Math.Distance.Between(this.x, this.y, data.x, data.y) > 150) {
            this.x = data.x;
            this.y = data.y;
            this.rotation = data.r;
            this.initialised = true;
        }

        // Update all targets
        this.target.x = data.x;
        this.target.y = data.y;
        this.target.r = data.r;
        this.velocity.x = data.vx;
        this.velocity.y = data.vy;
        this.angularVelocity = data.av;
        this.pilotId = data.pilotId;
    }

    /**
     * Delta sync- updates only what has changed, and leaves alone absent (undefined) data.
     * Matter-js bodies "sleep" when close to 0 speed, and their rotation becomes undefined, which defaults
     * to zero. This forces them to retain their actual rotation on the client
     * @param {Object} delta partial ship data (always includes id)
     */
    syncDelta(delta) {
        // Only update interpolation targets for fields that changed
        if (delta.x !== undefined) this.target.x = delta.x;
        if (delta.y !== undefined) this.target.y = delta.y;
        if (delta.r !== undefined) this.target.r = delta.r;
        if (delta.vx !== undefined) this.velocity.x = delta.vx;
        if (delta.vy !== undefined) this.velocity.y = delta.vy;
        if (delta.av !== undefined) this.angularVelocity = delta.av;
        if (delta.pilotId !== undefined) this.pilotId = delta.pilotId;
    }

    /**
     * Updates the position of this ship and the entities inside it from the target
     * data provided in syncFromServer(). Extrapolates the position from
     * the current speed and the time since the last update to predict the movement of the ship
     * without waiting for a server update.
     * @param {number} delta 
     */
    update(delta) {
        if (!this.initialised) return;

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

        // Calculate the amount to interpolate 
        const deltaTime = delta / 1000;
        const lerp = 1 - Math.pow(1 - 0.1, delta / 16.67);

        // Use distance = speed * time to calculate the predicted destination
        const predictedX = this.target.x + this.velocity.x * deltaTime;
        const predictedY = this.target.y + this.velocity.y * deltaTime;
        const predictedR = this.target.r + this.angularVelocity * deltaTime;

        // Move smoothly to the predicted position, avoiding round pixels
        this.x = Phaser.Math.Linear(this.x, predictedX, lerp)
        this.y = Phaser.Math.Linear(this.y, predictedY, lerp)

        // this.x = Math.round(Phaser.Math.Linear(this.x, predictedX, lerp));
        // this.y = Math.round(Phaser.Math.Linear(this.y, predictedY, lerp));

        // Also interpolate the rotation
        const diff = Phaser.Math.Angle.Wrap(predictedR - this.rotation);
        this.rotation += diff * lerp;
    }


}