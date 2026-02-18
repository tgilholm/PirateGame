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
        this.drawHull()
    }

    drawHull() {
        if (!this.params) return;
        const { height, middleWidth, bowLength, sternRadius } = this.params;
        const halfH = height / 2;
        const halfW = middleWidth / 2;
        const segments = 12;

        this.graphics.clear();
        this.graphics.fillStyle(0x5d4037, 1);
        this.graphics.lineStyle(4, 0xffffff, 1);

        this.graphics.beginPath();

        // STERN
        for (let i = 0; i <= segments; i++) {
            const theta = (Math.PI / 2) + (i / segments) * Math.PI;
            const px = -halfW + (Math.cos(theta) * sternRadius);
            const py = Math.sin(theta) * sternRadius;
            if (i === 0) this.graphics.moveTo(px, py);
            else this.graphics.lineTo(px, py);
        }

        // BOW TOP
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const px = halfW + (t * bowLength);
            const py = -halfH * (1 - (t * t)); // Quadratic curve
            this.graphics.lineTo(px, py);
        }

        // BOW BOTTOM
        for (let i = segments; i >= 0; i--) {
            const t = i / segments;
            const px = halfW + (t * bowLength);
            const py = halfH * (1 - (t * t));
            this.graphics.lineTo(px, py);
        }

        this.graphics.closePath();
        this.graphics.fillPath();
        this.graphics.strokePath();

        this.container.add(this.graphics);
        this.container.setDepth(10); // Force above the tilemap
    }

    drawDebugHitbox() {
        const debug = this.scene.add.graphics();
        debug.lineStyle(2, 0x00ff00, 1);
        this.container.add(debug);
    }

    update() {
        if (!this.target) return;
        // Interpolate between the client and server positions
        this.container.x = Phaser.Math.Linear(this.container.x, this.target.x, 0.2);
        this.container.y = Phaser.Math.Linear(this.container.y, this.target.y, 0.2);

        // Interpolate rotation
        let targetAngle = this.target.r; 
        let currentAngle = this.container.rotation;
        let diff = targetAngle - currentAngle;

        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.container.rotation += diff * 0.2;
    }
}