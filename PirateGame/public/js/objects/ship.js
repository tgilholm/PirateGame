//import Helm from "./helm.js";
import Parent from "./parent.js";

/**
 * The Ship class provides a moving body on which Interactables and Players can exist.
 * It can move independently and all objects "attached" to it will move with it- players'
 * movement is added on to the ship's movement so that in the world space, players move
 * independently of the ship.
 * 
 */
export default class Ship// extends Parent {
{
    constructor(scene, x, y) {
        this.scene = scene;

        this.container = scene.add.container(x, y);
        this.serverData = { x: x, y: y, rotation: 0 };


        const graphics = scene.add.graphics();

        // Draw the hull
        graphics.fillStyle(0x5d4037, 1); // dark brown
        graphics.lineStyle(4, 0x3e2723, 1);

        // Rectangle
        graphics.fillRect(-150, -80, 200, 160);
        graphics.strokeRect(-150, -80, 200, 160);

        // Triangle
        graphics.beginPath();
        graphics.moveTo(50, -80);
        graphics.lineTo(130, 0);
        graphics.lineTo(50, 80);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();

        this.container.add(graphics);
    }

    onServerUpdate(data) {
        this.serverData = data;
    }

    update() {
        if (!this.serverData) return;

        console.log(this.serverData)

        this.container.x = Phaser.Math.Linear(this.container.x, this.serverData.x, 0.2); // interpolate 20% between the old and new data
        this.container.y = Phaser.Math.Linear(this.container.y, this.serverData.y, 0.2);
        const rotationDiff = Phaser.Math.Angle.ShortestBetween(
            Phaser.Math.RadToDeg(this.container.rotation),
            Phaser.Math.RadToDeg(this.serverData.rotation)
        );

        // Convert back to radians and add 10% of that difference
        this.container.rotation += Phaser.Math.DegToRad(rotationDiff) * 0.1;
    }
}