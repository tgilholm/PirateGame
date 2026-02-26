/* global Phaser */

/**
 * InputHandler — owns all keyboard and mouse input setup for the main scene.
 *
 * Centralises key registration, exposes typed key groups, and provides
 * helpers so the rest of the codebase never needs to touch the Phaser
 * keyboard API directly.
 *
 * Note: the debug-menu toggle key (X) is intentionally left with DebugMenu /
 * UI, since it is scoped to that subsystem and registered there.
 */
export default class InputHandler {

    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;

        // WASD movement + in-world interaction keys
        this.keys = /** @type {any} */ (scene.input.keyboard.addKeys(
            "W, A, S, D, E, Q, space"
        ));

        // Camera / utility keys
        this.shipKeys = /** @type {any} */ (scene.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            zoom: Phaser.Input.Keyboard.KeyCodes.Z,
        }));

        // Auto-cleanup when the owning scene shuts down
        scene.events.once("shutdown", () => this.destroy());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Returns true only on the frame the key is first pressed (not held).
     * @param {Phaser.Input.Keyboard.Key} key
     * @returns {boolean}
     */
    justPressed(key) {
        return Phaser.Input.Keyboard.JustDown(key);
    }

    /**
     * Builds the movement/action payload expected by the server's
     * player:moveInput event.
     * @returns {{ up: boolean, left: boolean, down: boolean, right: boolean, e: boolean, q: boolean, space: boolean }}
     */
    getMovementInput() {
        const k = this.keys;
        return {
            up: k.W.isDown,
            left: k.A.isDown,
            down: k.S.isDown,
            right: k.D.isDown,
            e: k.E.isDown,
            q: k.Q.isDown,
            space: k.space.isDown
        };
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    destroy() {
        // Phaser manages key-listener cleanup; nothing extra needed here
    }
}
