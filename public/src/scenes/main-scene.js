/* global Phaser, io */

import NetworkManager from '../managers/network-manager.js';
import GameManager from '../managers/game-manager.js';
import UIManager from '../managers/ui-manager.js';
import InputManager from '../managers/input-manager.js';
import ModelFactory from '../managers/model-factory.js';
import AnimationManager from '../managers/animation-manager.js';
import Minimap from '../ui/minimap.js';
import ShopUI from '../ui/shop-ui.js';

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
		this.targetZoom = 0.8;

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
		this.map = this.make.tilemap({ key: 'map' });

		// Allow key inputs again
		this.input.keyboard.enableGlobalCapture();

		this.setupWorld();

		const canvas = document.getElementById('minimap-canvas');
		if (!(canvas instanceof HTMLCanvasElement)) return; // shut up the linter

		//@ts-ignore cheesed into this window
		const entityConfig = window.entityConfig;

		//@ts-ignore
		const upgradeConfig = window.upgradeConfig;
		//@ts-ignore more cheese
		const showDebug = window.showDebug;

		const modelFactory = new ModelFactory(this, entityConfig, (id) => this.gameManager.models.get(id));
		this.inputManager = new InputManager(this);
		this.gameManager = new GameManager(this, new NetworkManager(socket), this.inputManager, modelFactory);
		this.animationManager = new AnimationManager(this);

		const minimap = new Minimap(this.map, canvas);
		this.shopUI = new ShopUI(this.gameManager, upgradeConfig, (name) => {
			this.gameManager.buyUpgrade(name);
		});
		this.uiManager = new UIManager(this, this.gameManager, minimap, this.map, this.shopUI, showDebug);

		this.cameraTarget = this.add.circle(0, 0, 5, 0xffffff, 0);
		const camera = this.cameras.main;

		camera.startFollow(this.cameraTarget, true);
		camera.zoom = this.targetZoom;

		this.inputManager.on('zoom', (deltaY) => {
			const step = deltaY > 0 ? -0.1 : 0.1;

			const minZoom = 0.4;
			const maxZoom = 1.25;

			this.targetZoom = Phaser.Math.Clamp(this.targetZoom + step, minZoom, maxZoom); // between 30%-150% zoom
		});

		// Contain the camera in the map
		this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
		this.gameManager.start(data.username, data.pirateColour ?? 'default');

		this.gameManager.on('shipSunk', () => {
			this.uiManager.showShipSunkMessage();
		});

		this.events.on('shutdown', () => {
			this.gameManager.destroy();
		});
	}

	goToStart() {
		// Hide all game-related prompts
		this.scene.start('StartScene');
	}

	/**
	 * The update loop of the game. Updates all dependent classes
	 */
	update() {
		this.gameManager.update();
		this.uiManager.update();

		const camera = this.cameras.main;
		camera.zoom += (this.targetZoom - camera.zoom) * 0.1;
	}

	/**
	 * Generates the tilemap for this world from the provided tilesheet
	 */
	setupWorld() {
		const tileset = this.map.addTilesetImage('terrain-tilesheet', 'tiles');

		this.seaLayer = this.map.createLayer('sea', tileset, 0, 0);
		this.shallowsLayer = this.map.createLayer('shallows', tileset, 0, 0);
		this.islandsLayer = this.map.createLayer('islands', tileset, 0, 0);

		[this.seaLayer, this.shallowsLayer, this.islandsLayer].forEach((l) => l.setCullPadding(2, 2));
	}
}
