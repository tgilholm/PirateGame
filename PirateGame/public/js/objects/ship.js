//import Helm from "./helm.js";
import Parent from "./parent.js";

/**
 * The Ship class provides a moving body on which Interactables and Players can exist.
 * It can move independently and all objects "attached" to it will move with it- players'
 * movement is added on to the ship's movement so that in the world space, players move
 * independently of the ship.
 * 
 */
export default class Ship extends Parent {
    constructor(scene, x, y, params) {
        super(scene, x, y);
        this.params = params;
        this.hullSprite = null;
        this.drawHull();
    }

    drawHull() {
        if (!this.params) return;
        const { height, middleWidth, bowLength, sternRadius } = this.params;
        const halfH = height / 2;
        const halfW = middleWidth / 2;
        const segments = 12;
        const padding = 5;
        const totalW = middleWidth + bowLength + sternRadius + (padding * 2);
        const totalH = height + (padding * 2);
        const offsetX = sternRadius + halfW + padding;
        const offsetY = halfH + padding;

        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
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

        const textureName = `hull_${this.params.id}`;
        graphics.generateTexture(textureName, totalW, totalH);

        // Create sprite and set origin to the relative center
        if (this.hullSprite) this.hullSprite.destroy();
        this.hullSprite = this.scene.add.sprite(0, 0, textureName);

        this.hullSprite.setOrigin(offsetX / totalW, offsetY / totalH);

        this.container.add(this.hullSprite);
        this.container.sendToBack(this.hullSprite);
        this.container.setDepth(10);
    }


    update() {
        if (!this.target) return;
        // Interpolate between the client and server positions
        this.container.x = Phaser.Math.Linear(this.container.x, this.target.x, 0.15);
        this.container.y = Phaser.Math.Linear(this.container.y, this.target.y, 0.15);

        // Interpolate rotation
        this.container.rotation = Phaser.Math.Angle.RotateTo(
            this.container.rotation,
            this.target.r,
            0.1
        );
    }
}