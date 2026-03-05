/* global Phaser */

import PlayerModel from "../models/player-model.js";

/**
 * InputHandler — owns all keyboard and mouse input setup for the main scene.
 *
 * Centralises key registration, exposes typed key groups, and provides
 * helpers so the rest of the codebase never needs to touch the Phaser
 * keyboard API directly.
 *
 */
export default class InputManager extends Phaser.Events.EventEmitter {
    /**
     * Builds an InputManager and starts the keyboard listeners
     * @param {Phaser.Scene} scene 
     */
    constructor(scene) {
        super();

        this.moveKeys = scene.input.keyboard.addKeys("W,A,S,D");

        scene.input.keyboard.on('keydown-E', () => this.emit('interact'));
        scene.input.keyboard.on('keydown-Q', () => this.emit('release'));
        scene.input.keyboard.on('keydown-SPACE', () => this.emit('fire'));
    }

    /**
     * Gets the current position of the mouse and keyboard inputs
     * @param {Phaser.Scene} scene 
     * @param {PlayerModel} player
     * @returns the player inputs
     */
    getInputs(scene, player) {
        /** @type {any} */
        const keys = this.moveKeys;
        const mouseY = scene.input.mousePointer.worldY;
        const mouseX = scene.input.mousePointer.worldX;

        const worldPos = player.getWorldTransformMatrix();  // Absolute coords

        const aimAngle = Math.atan2(    // Angle from player to mouse
            mouseY - worldPos.ty,
            mouseX - worldPos.tx
        );

        return {
            up: keys.W.isDown,
            down: keys.S.isDown,
            left: keys.A.isDown,
            right: keys.D.isDown,
            aimAngle: aimAngle
        }
    }
}
