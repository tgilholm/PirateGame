/* global Phaser */

import Model from "./model.js";
import ShipModel from "./ship-model.js";

/**
 * Client-side Player. Owns presentation concerns for player objects
 */
export default class PlayerModel extends Model {

    /**
     * Constructs a player in the specified scene with the provided id and coordinates
     * @param {Phaser.Scene} scene the scene to add this player to
     * @param {string} id the id (usually the socket id) of this player
     * @param {number} x the start x coordinate (relative/absolute)
     * @param {number} y the start y coordinate (relative/absolute)
     */
    constructor(scene, id, x, y) {
        super(scene, id, x, y, 0, false); // players can move

        this.target = { x: 0, y: 0, r: 0 }; // r represents the target aim angle
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
     * Extend the base sync() method with generic model data, and provide player-specific data
     * from the server here.
     * @param {Object} data the data from the server
     */
    sync(data) {
        super.sync(data);   // Sync generic model data

        if (data.username && this.nameText.text !== data.username) {
            this.nameText.setText(data.username);
            this.username = data.username;
        }

        if (data.isSteering !== undefined) this.isSteering = data.isSteering;
        if (data.isUsingCannon !== undefined) this.isUsingCannon = data.isUsingCannon;
    }


    /**
     * Override the postUpdate() class to provide functionality specific to this player,
     * without needing to touch the base update() class
     * @param {number} delta the difference in time from the last update
     * @param {number} deltaTime the delta, in seconds
     * @param {number} lerp the lerp factor, calculated from the delta
     */
    postUpdate(delta, deltaTime, lerp) {
        const gun = this.gun;
        const pos = this.worldPos;
        const isBusy = this.isSteering || this.isUsingCannon;


        // If on a ship, move up and down with it
        if (this.parentContainer instanceof ShipModel) {
            const bob = this.parentContainer.hullSprite.y;
            this.bodySprite.y = bob;
        } else {
            this.bodySprite.y = 0;
        }

        // Move the gun around the outside of the player
        gun.setPosition(
            pos.x + Math.cos(this.aimAngle) * 15,   // radius of player
            pos.y + Math.sin(this.aimAngle) * 15
        );
        gun.setRotation(this.aimAngle);

        // Ignore any relative coordinates/rotation for the name tag- always display upright
        this.nameText.setPosition(pos.x, pos.y - 25);

        // Hide the player's gun and make them slightly transparent when interacting
        this.gun.setVisible(isBusy ? false : true);
        this.setAlpha(isBusy ? 0.6 : 1.0);
    }


    /**
     * Overrides interpRotation because the player's definition of rotation applies
     * to their gun (for now).
     * @param {number} lerp the interpolation factor 
     */
    interpRotation(lerp) {
        // Rotate the aim angle smoothly
        const aimDiff = Phaser.Math.Angle.Wrap(this.target.r - this.aimAngle);
        this.aimAngle += aimDiff * lerp;
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