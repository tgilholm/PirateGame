/* global Phaser, io */

import NetworkManager from '../managers/network-manager.js';
import GameManager from '../managers/game-manager.js';
import UIManager from '../managers/ui-manager.js';
import InputManager from '../managers/input-manager.js';
import ModelFactory from '../managers/model-factory.js';
import AnimationManager from '../managers/animation-manager.js';

/**
 * The main scene of the Phaser game. This class should act as the "orchestrator"
 * of the client-side manager classes, by delegating responsibility into separate classes
 * and updating them in the update() loop.
 */
export class MainScene extends Phaser.Scene {
	constructor() {
		super('MainScene');

		this.shipParams = null;
		this.showDebugHitboxes = true;
		this.debugGraphics = null;
		this.cameraTarget = null;
		this.projectiles = new Map();

		window.addEventListener('resize', () => {
			this.scale.resize(window.innerWidth, window.innerHeight);
		});
	}

	/**
	 * Executed once at runtime- set up all game objects here, such
	 * as setting up user input and socket listeners.
	 */
	create(data) {
		// Create the socket here so it only connects when the scene actually starts,
		// not at module load time before GameManager exists to receive INIT_GAME
		const socket = globalThis.io();

		this.setupWorld();

		//@ts-ignore cheesed into this window
		const entityConfig = window.entityConfig;
		const modelFactory = new ModelFactory(this, entityConfig, (id) =>
			this.gameManager.models.get(id)
		);

		this.gameManager = new GameManager(
			this,
			new NetworkManager(socket),
			new InputManager(this),
			modelFactory
		);
		this.animationManager = new AnimationManager(this);
		this.uiManager = new UIManager(this, this.gameManager);

		this.cameraTarget = this.add.circle(0, 0, 5, 0xffffff, 0);
		this.cameras.main.startFollow(this.cameraTarget);
		this.cameras.main.zoom = 0.8;

		// Placeholder player sprite
		const circle = this.make.graphics();
		circle.fillStyle(0xff0000, 1);
		circle.fillCircle(15, 15, 15);
		circle.generateTexture('player_circle', 30, 30);
		circle.destroy();

		// Placeholder cannonball sprite
		const ball = this.make.graphics();
		ball.fillStyle(0x222222, 1);
		ball.fillCircle(8, 8, 8);
		ball.generateTexture('cannonball', 16, 16);
		ball.destroy();

		const proj = this.make.graphics();
		proj.fillStyle(0x222222, 1);
		proj.fillCircle(4, 4, 4);
		proj.generateTexture('bullet', 8, 8);
		proj.destroy();

		// Placeholder NPC sprite
		const square = this.make.graphics();
		square.fillStyle(0x0000dd);
		square.fillRect(0, 0, 30, 30);
		square.generateTexture('npc_sprite', 30, 30);
		square.destroy();

		// Contain the camera in the map
		this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
		this.gameManager.start(data.username);

		this.gameManager.on('playerDied', () => {
			//this.uiManager.showDeathMessage();
		});
	}

	/**
	 * The update loop of the game. Updates all dependent classes
	 */
	update() {
		this.gameManager.update();
		this.uiManager.update();
		const gold = document.getElementById('gold-counter'); // ui concern
		if (gold) gold.style.display = 'none';
	}

	/**
	 * Generates the tilemap for this world from the provided tilesheet
	 */
	setupWorld() {
		this.map = this.make.tilemap({ key: 'map' });
		const tileset = this.map.addTilesetImage('terrain-tilesheet', 'tiles');

		// call to destroy game manager on shutdown
		this.events.on('shutdown', () => {
			this.gameManager.destroy();
		});

		this.seaLayer = this.map.createLayer('sea', tileset, 0, 0);
		this.shallowsLayer = this.map.createLayer('shallows', tileset, 0, 0);
		this.islandsLayer = this.map.createLayer('islands', tileset, 0, 0);

		[this.seaLayer, this.shallowsLayer, this.islandsLayer].forEach((l) =>
			l.setCullPadding(2, 2)
		);
	}
}
