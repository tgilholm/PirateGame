/* global Phaser */

/**
 * InputHandler — owns all keyboard and mouse input setup for the main scene.
 *
 * Centralises key registration, exposes typed key groups, and provides
 * helpers so the rest of the codebase never needs to touch the Phaser
 * keyboard API directly.
 *
 * Note: the debug-menu toggle key (X) is intentionally left with debug-menu /
 * UI, since it is scoped to that subsystem and registered there.
 */
export default class InputManager extends Phaser.Events.EventEmitter {
    /**
     * 
     * @param {Phaser.Scene} scene 
     */
    constructor(scene) {
        super();

        this.moveKeys = scene.input.keyboard.addKeys("W,A,S,D");

        scene.input.keyboard.on('keydown-E', () => this.emit('interact'));
        scene.input.keyboard.on('keydown-Q', () => this.emit('release'));
        scene.input.keyboard.on('keydown-SPACE', () => this.emit('fire'));
    }

    getMovementInputs() {
        /** @type {any} */
        const keys = this.moveKeys;
        return {
            up: keys.W.isDown,
            down: keys.S.isDown,
            left: keys.A.isDown,
            right: keys.D.isDown,
        }
    }

}
