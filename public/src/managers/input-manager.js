/* global Phaser */

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
     * 
     * @param {Phaser.Scene} scene 
     */
    constructor(scene) {
        super();

        this.moveKeys = scene.input.keyboard.addKeys("W,A,S,D");

        scene.input.keyboard.on('keydown-E', () => this.emit('interact'));
        scene.input.keyboard.on('keydown-Q', () => this.emit('release'));
        scene.input.keyboard.on('keydown-SPACE', () => this.emit('fire'));
        scene.input.keyboard.on('keydown-X', () => this.emit('toggleDebugMenu'));
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
