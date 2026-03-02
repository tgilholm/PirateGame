/** @typedef {import("shared/entity-config.json")["ship"]} ShipConfig */

import Interactable from "./interactable.js";

/**
 * The Ship class provides a moving body on which Interactables and Players can exist.
 * It can move independently and all objects "attached" to it will move with it- players'
 * movement is added on to the ship's movement so that in the world space, players move
 * independently of the ship.
 * 
 */
export default class ShipModel extends Phaser.GameObjects.Container {

    /**
     * @param {Phaser.Scene} scene
     * @param {string} id
     * @param {number} x
     * @param {number} y
     * @param {ShipConfig} config
     */
    constructor(scene, id, x, y, config) {
        super(scene, x, y);
        this.dimensions = config.dimensions;
        this.interactables = [];
        this.id = id;


        this.target = { x: 0, y: 0, r: 0 };
        this.velocity = { x: 0, y: 0 };
        this.pilotId = null;
        this.angularVelocity = 0;

        if (config.interactables) {
            config.interactables.forEach(item => {
                const model = new Interactable(this.scene, this, item);
                this.interactables.push(model);
            })
        }


        this.drawHull();
        this.drawInteractables();
        this.setRotation(0);
        scene.add.existing(this);
    }

    drawHull() {
        if (!this.dimensions) return;
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

        // Stern
        for (let i = 0; i <= segments; i++) {
            const theta = (Math.PI / 2) + (i / segments) * Math.PI;
            const px = offsetX + (-halfW + (Math.cos(theta) * sternRadius));
            const py = offsetY + (Math.sin(theta) * sternRadius);
            if (i === 0) graphics.moveTo(px, py);
            else graphics.lineTo(px, py);
        }

        // Bow top
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const px = offsetX + (halfW + (t * bowLength));
            const py = offsetY + (-halfH * (1 - (t * t)));
            graphics.lineTo(px, py);
        }

        // Bow bottom
        for (let i = segments; i >= 0; i--) {
            const t = i / segments;
            const px = offsetX + (halfW + (t * bowLength));
            const py = offsetY + (halfH * (1 - (t * t)));
            graphics.lineTo(px, py);
        }

        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();

        const textureName = 'hull';
        if (!this.scene.textures.exists(textureName)) {
            graphics.generateTexture(textureName, totalW, totalH);
        }


        // Create sprite and set origin to the relative center
        if (this.hullSprite) this.hullSprite.destroy();
        this.hullSprite = this.scene.add.sprite(0, 0, textureName);

        this.hullSprite.setOrigin(offsetX / totalW, offsetY / totalH);

        this.add(this.hullSprite);
        this.sendToBack(this.hullSprite);
        this.setDepth(10);
    }

    drawInteractables() {
        // Get interactable positions from dimensions and create sprites for them
        this.interactables.forEach(i => {
            const item = this.add(i);
            item.y < 0 ? item.setRotation(0) : item.setRotation(Math.PI);
        })
    }


    update(data, delta) {
        this.syncFromServer(data);

        // Snap if position drifted
        if (Phaser.Math.Distance.Between(this.x, this.y, data.x, data.y) > 150) {
            this.x = data.x;
            this.y = data.y;
        }

        const deltaTime = delta / 1000;
        const lerp = 1 - Math.pow(1 - 0.1, delta / 16.67);


        // Extrapolate from velocity and time
        const predictedX = this.target.x + this.velocity.x * deltaTime; // where x is in however many milliseconds
        const predictedY = this.target.y + this.velocity.y * deltaTime; // Distance = speed * time
        const predictedR = this.target.r + this.angularVelocity * deltaTime;

        this.x = Math.round(Phaser.Math.Linear(this.x, predictedX, lerp));
        this.y = Math.round(Phaser.Math.Linear(this.y, predictedY, lerp));

        this.rotation = Phaser.Math.Angle.RotateTo(
            this.rotation,
            predictedR,
            lerp
        );
    }

    syncFromServer(data) {
        this.target.x = data.x;
        this.target.y = data.y;
        this.target.r = data.r;

        this.velocity.x = data.vx;
        this.velocity.y = data.vy;
        this.angularVelocity = data.av;
        this.pilotId = data.pilotId;
    }
}