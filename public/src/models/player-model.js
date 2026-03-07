/* global Phaser */

import ShipModel from "./ship-model.js";

/**
 * Client-side Player. Owns presentation concerns for player objects
 */
export default class PlayerModel extends Phaser.GameObjects.Container {

    /**
     * Constructs a player in the specified scene with the provided id and coordinates
     * @param {Phaser.Scene} scene the scene to add this player to
     * @param {string} id the id (usually the socket id) of this player
     * @param {number} x the start x coordinate (relative/absolute)
     * @param {number} y the start y coordinate (relative/absolute)
     */
    constructor(scene, id, x, y) {
        super(scene, x, y);

        this.scene.add.existing(this);

        this.id = id;
        this.target = { x: 0, y: 0, aimAngle: 0 };
        this.velocity = { x: 0, y: 0 };
        this.isSteering = false;
        this.isUsingCannon = false;
        this.aimAngle = 0;
        this.parentId = null;
        this.username = null;

        // Name text is not a child of the container- avoids counter-rotation logic
        this.nameText = scene.add.text(0, -50, '', {
            fontSize: '12px',
            fontFamily: 'Consolas',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5, 1).setDepth(100).setPosition(0, -25);
        this.bodySprite = scene.add.sprite(0, 0, 'player_circle');
        this.add(this.bodySprite);

        this.gun = scene.add.rectangle(x + 15, y, 15, 5, 0x000000).setDepth(100);
    }


    /**
     * Updates the client-side state of this player object with the data received from the server.
     * This method should be called every time new player data is received. 
     * @param {Object} data 
     */
    syncFromServer(data) {
        // Only updates if a username was not already set
        if (data.username && this.nameText.text !== data.username) {
            this.nameText.setText(data.username);
            this.username = data.username;
        }
        this.target.x = data.x; // The coordinate to aim for in interpolation
        this.target.y = data.y;
        this.target.aimAngle = data.aimAngle;
        this.velocity.x = data.vx;
        this.velocity.y = data.vy;
        this.isSteering = data.isSteering;
        this.isUsingCannon = data.isUsingCannon;
    }

    /**
     * Updates this player from the target data received in the syncFromServer() method. Interpolates
     * (moves smoothly) between the player's last coordinate and the target received from the server.
     * @param {number} delta 
     */
    update(delta) {
        const responseFactor = 0.075;
        const lerp = 1 - Math.pow(1 - responseFactor, delta / 16.6667);
        const deltaTime = delta / 1000;

        const predictedX = this.target.x + this.velocity.x * deltaTime;
        const predictedY = this.target.y + this.velocity.y * deltaTime;

        this.x = Phaser.Math.Linear(this.x, predictedX, lerp);
        this.y = Phaser.Math.Linear(this.y, predictedY, lerp);

        // For other players- local player's aim angle is taken immediately from their inputs
        const aimDiff = Phaser.Math.Angle.Wrap(this.target.aimAngle - this.aimAngle);
        this.aimAngle += aimDiff * lerp;

        // If on a ship, move up and down with it
        if (this.parentContainer instanceof ShipModel) {
            const bob = this.parentContainer.hullSprite.y;
            this.bodySprite.y = bob;
        } else {
            this.bodySprite.y = 0;
        }

        const worldPos = this.getWorldTransformMatrix();
        const gun = this.gun;
        gun.x = worldPos.tx + Math.cos(this.aimAngle) * 15;  // radius
        gun.y = worldPos.ty + Math.sin(this.aimAngle) * 15;
        gun.setRotation(this.aimAngle);

        // Ignore any relative coordinates/rotation for the name tag- always display upright
        this.nameText.setPosition(worldPos.tx, worldPos.ty - 25);

        const isBusy = this.isSteering || this.isUsingCannon;

        // Hide the player's gun and make them slightly transparent when interacting
        this.gun.setVisible(isBusy ? false : true);
        this.setAlpha(isBusy ? 0.6 : 1.0);
    }



    /**
     * Removes this player from the game and destroys all connected sprites
     */
    destroy() {
        if (this.nameText) this.nameText.destroy();
        if (this.gun) this.gun.destroy();

        super.destroy();
    }
}