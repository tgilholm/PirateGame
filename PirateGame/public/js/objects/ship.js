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

    update(data) {
        this.container.x = Phaser.Math.Linear(this.container.x, data.x, 0.2); // interpolate 20% between the old and new data
        this.container.y = Phaser.Math.Linear(this.container.y, data.y, 0.2);
        this.container.rotation = data.rotation;    // don't interpolate rotation
    }
}







    // /**
    //  * Generates a new instance of a Ship at the provided coordinates.
    //  * @param {Phaser.Scene} scene The Phaser.Scene this ship is created in
    //  * @param {Number} x The absolute (world-scope) X coordinate of the ship 
    //  * @param {Number} y The absolute (world-scope) Y coordinate of the ship 
    //  */
    // constructor(scene, x, y) {
    //     this.scene = scene;
    //     this.x = x;
    //     this.y = y;
    //     this.rotation = 0;  // Initial rotation is 0;

    //     // Draw the ship
    //     this.container = scene.add.container(x, y);
    //     this.graphics = scene.add.graphics();
    //     this.drawHull();
    //     this.container.add(this.graphics);

    //     // Attach interactables
    //     //this.helm = new Helm(this, -120, 0); // At the back of the ship

    //     //.. add other interactables here
    // }

    // /**
    //  * Draws a simple "hull" shape consisting of a rectangle
    //  * connected to a triangle.
    //  */
    // drawHull() {
    //     this.graphics.fillStyle(0x5d4037, 1); // dark brown
    //     this.graphics.lineStyle(4, 0x3e2723, 1);

    //     // Rectangle
    //     this.graphics.fillRect(-150, -80, 200, 160);
    //     this.graphics.strokeRect(-150, -80, 200, 160);

    //     // Triangle
    //     this.graphics.beginPath();
    //     this.graphics.moveTo(50, -80);
    //     this.graphics.lineTo(130, 0);
    //     this.graphics.lineTo(50, 80);
    //     this.graphics.closePath();
    //     this.graphics.fillPath();
    //     this.graphics.strokePath();
    // }

    // /**
    //  * Checks whether the provided coordinates (of an interactable or player) are within
    //  * the bounds of the ship's hull. 
    //  * @param {Number} localX The x coordinate of the object relative to the ship
    //  * @param {Number} localY The y coordinate of the object relative to the ship
    //  * @returns True if the object is "inside" the ship, false otherwise
    //  */
    // isOnDeck(localX, localY) {
    //     const halfWidth = 80;

    //     // Is the object in the "main rectangle"
    //     if (localX >= -150 && localX <= 50) {   // check left to right
    //         return Math.abs(localY) <= halfWidth; // check up and down
    //     }


    //     // Is the object in the "bow" triangle
    //     if (localX > 50 && localX <= 130) { // check left to right

    //         // calculate the taper of the bow and check if inside
    //         const taper = (1 - (localX - 50) / 80) * halfWidth;
    //         return Math.abs(localY) <= taper;
    //     }
    //     return false; // if neither returned true
    // }


    // /**
    //  * Uses linear interpolation to smooth out space between ship movement frames
    //  * @param {Number, Number} serverData the x and y coordinates of the ship as it appears on the server
    //  */
    // update(serverData) {

    //     this.x = Phaser.Math.Linear(this.x, serverData.x, 0.2); // interpolate 20% between the old and new data
    //     this.y = Phaser.Math.Linear(this.y, serverData.y, 0.2);
    //     this.rotation = serverData.rotation;    // don't interpolate rotation

    //     // update the position of the ship
    //     this.container.setPosition(this.x, this.y);
    //     this.container.setRotation(this.rotation);
    // }
