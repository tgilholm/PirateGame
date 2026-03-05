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
        this.isSteering = data.isSteering;
        this.isUsingCannon = data.isUsingCannon;
    }

    /**
     * Helper method to update the rotation of the player's gun from a specified angle. Rotates
     * about the centre of the player, while adhering to the outer edge of their sprite
     * @param {number} angle 
     */
    setGunRotation(angle) {
        const worldPos = this.getWorldTransformMatrix();

        const gun = this.gun;
        gun.x = worldPos.tx + Math.cos(angle) * 15;  // radius
        gun.y = worldPos.ty + Math.sin(angle) * 15;
        gun.setRotation(angle);
    }

    /**
     * Updates this player from the target data received in the syncFromServer() method. Interpolates
     * (moves smoothly) between the player's last coordinate and the target received from the server.
     * @param {number} delta 
     */
    update(delta) {
        const responseFactor = 0.15;
        const lerp = 1 - Math.pow(1 - responseFactor, delta / 16.6667);

        this.x = Phaser.Math.Linear(this.x, this.target.x, lerp);   // move smoothly between the two
        this.y = Phaser.Math.Linear(this.y, this.target.y, lerp);

        // For other players- local player's aim angle is taken immediately from their inputs
        this.aimAngle = Phaser.Math.Angle.RotateTo(
            this.aimAngle,
            this.target.aimAngle,
            lerp
        );
        this.setGunRotation(this.aimAngle);

        // If on a ship, move up and down with it
        if (this.parentContainer instanceof ShipModel) {
            const bob = this.parentContainer.hullSprite.y;
            this.y += bob; // hi bob
        }

        // Ignore any relative coordinates/rotation for the name tag- always display upright
        const worldPos = this.getWorldTransformMatrix();
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