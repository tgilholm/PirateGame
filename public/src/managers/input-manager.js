/* global Phaser */

import PlayerModel from '../models/player-model.js';

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

		this.moveKeys = scene.input.keyboard.addKeys('W,A,S,D');

		//Original Function---------------------------------------------------------
		//scene.input.mouse.onMouseDown(() => this.emit('fire'));   // mouse & space
		//--------------------------------------------------------------------------

		//From what I gathered in the documentation for Phaser, it looks like onMouseDown()
		//only listens for mouse events in the browser, rather than Phaser's input system
		//The Phaser documentation references that input.on('pointerdown') will listen for
		//that event anywhere on the canvas, so I figured would try and tie that in, and
		//it appears to work in all of the instances I tested
		//New Implementation--------------------------------------------------------
		scene.input.on('pointerdown', (pointer) => {
			if (pointer.rightButtonDown()) {
				this.emit('swing');
			} else {
				this.emit('fire');
			}
		});
		//--------------------------------------------------------------------------

		scene.input.keyboard.on('keydown-E', () => this.emit('interact'));
		scene.input.keyboard.on('keydown-Q', () => this.emit('release'));
		scene.input.keyboard.on('keydown-SPACE', () => this.emit('fire'));
		scene.input.keyboard.on('keydown-SHIFT', () => this.emit('dash'));
		scene.input.keyboard.on('keydown-ESC', () => this.emit('settings'));

		const settingsButton = document.getElementById('settings-button');
		settingsButton.addEventListener('click', () => this.emit('settings'));

		scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
			this.emit('zoom', deltaY);
		});
		const respawnButton = document.getElementById('restart-button');
		const quitButton = document.getElementById('quit-button');
		const visible = respawnButton.style.display !== 'none' && quitButton.style.display !== 'none';

		respawnButton.addEventListener('click', () => {
			// Allow only if on screen
			if (visible) this.emit('respawn');
		});

		quitButton.addEventListener('click', () => {
			if (visible) this.emit('quit');
		});
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

		scene.input.mousePointer.updateWorldPoint(scene.cameras.main);
		const mouseWorldX = scene.input.mousePointer.worldX;
		const mouseWorldY = scene.input.mousePointer.worldY;
		const worldPos = player.getWorldTransformMatrix();

		const aimAngle = Math.atan2(mouseWorldY - worldPos.ty, mouseWorldX - worldPos.tx);

		return {
			up: keys.W.isDown,
			down: keys.S.isDown,
			left: keys.A.isDown,
			right: keys.D.isDown,
			aimAngle: isFinite(aimAngle) ? aimAngle : 0,
		};
	}
}
