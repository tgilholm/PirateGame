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
    constructor(scene, x, y) {
        super(scene, x, y);

        this.serverData = { x: x, y: y, rotation: 0 };

        this.container.setBody({
            type: 'rectangle',
            width: 300,
            height: 160
        });

        this.container.setFrictionAir(0.05);
        this.container.setMass(20);

        // // Draw the hull
        this.graphics.fillStyle(0x5d4037, 1); // dark brown
        this.graphics.lineStyle(4, 0x3e2723, 1);

        // // Rectangle
        this.graphics.fillRect(-150, -80, 200, 160);
        this.graphics.strokeRect(-150, -80, 200, 160);

        // // Triangle
        this.graphics.beginPath();
        this.graphics.moveTo(50, -80);
        this.graphics.lineTo(130, 0);
        this.graphics.lineTo(50, 80);
        this.graphics.closePath();
        this.graphics.fillPath();
        this.graphics.strokePath();

        this.container.add(this.graphics);
    }

    onServerUpdate(data) {
        this.serverData = data;
    }


    update() {
        if (!this.target) return;

        // Interpolate position
        this.container.x = Phaser.Math.Linear(this.container.x, this.target.x, 0.2);
        this.container.y = Phaser.Math.Linear(this.container.y, this.target.y, 0.2);

        // Handle Rotation
        const targetRot = this.target.r !== undefined ? this.target.r : this.target.rotation;

        const rotationDiff = Phaser.Math.Angle.ShortestBetween(
            Phaser.Math.RadToDeg(this.container.rotation),
            Phaser.Math.RadToDeg(targetRot || 0)
        );

        // Convert back to radians and add 10% of that difference
        this.container.rotation += Phaser.Math.DegToRad(rotationDiff) * 0.1;
    }
}