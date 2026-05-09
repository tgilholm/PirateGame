/* global Phaser, io, pako */

import NetworkManager from '../managers/network-manager.js';
import GameManager from '../managers/game-manager.js';
import UIManager from '../managers/ui-manager.js';
import InputManager from '../managers/input-manager.js';
import ModelFactory from '../managers/model-factory.js';
import AnimationManager from '../managers/animation-manager.js';
import SoundManager from '../managers/sound-manager.js';
import Minimap from '../ui/minimap.js';
import ShopUI from '../ui/shop-ui.js';
import SettingsUI from '../ui/settings-ui.js';

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
		this.targetZoom = 3;

		window.addEventListener('resize', () => {
			this.scale.resize(window.innerWidth, window.innerHeight);
		});
	}

	/**
	 * Executed once at runtime- set up all game objects here, such
	 * as setting up user input and socket listeners.
	 */
	async create(data) {
		const socket = globalThis.io();
		this.map = this.make.tilemap({ key: 'map' });
		this.input.keyboard.enableGlobalCapture();

		// Show loading bar again for tilemap setup
		const loadingScreen = document.getElementById('loading-screen');
		loadingScreen.style.display = 'flex';

		await this.setupWorld();

		loadingScreen.style.display = 'none';

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
		this.soundManager = new SoundManager(this);
		this.soundManager.playMusic('music-main');
		const wavesSound = this.soundManager.sounds.get('music-waves');
		if (wavesSound) wavesSound.play();

		const settingsConfig = this.cache.json.get('settings-config') ?? { sfx: 1.0, music: 1.0 };
		this.settingsUI = new SettingsUI(this.soundManager, settingsConfig);

		const minimap = new Minimap(this.map, canvas);
		this.shopUI = new ShopUI(this.gameManager, upgradeConfig, (name) => {
			this.gameManager.buyUpgrade(name);
		});
		this.uiManager = new UIManager(this, this.gameManager, minimap, this.map, this.shopUI, showDebug);

		this.cameraTarget = this.add.circle(0, 0, 5, 0xffffff, 0);
		const camera = this.cameras.main;

		camera.startFollow(this.cameraTarget, true, 0.1, 0.1);
		camera.zoom = this.targetZoom;

		this.inputManager.on('zoom', (deltaY) => {
			const step = deltaY > 0 ? -0.1 : 0.1;

			const minZoom = 1.4;
			const maxZoom = 2.5;

			this.targetZoom = Phaser.Math.Clamp(this.targetZoom + step, minZoom, maxZoom);
		});

		this.inputManager.on('settings', () => {
			this.settingsUI.toggle();
		});

		// Contain the camera in the map
		this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
		this.gameManager.start(data.username, data.pirateColour ?? 'default', data.shipChoice ?? 0);

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
		if (this.gameManager) this.gameManager.update();
		if (this.uiManager) this.uiManager.update();

		const camera = this.cameras.main;
		camera.zoom += (this.targetZoom - camera.zoom) * 0.1;
	}

	/**
	 * Generates the tilemap for this world from the provided tilesheet
	 */
	setupWorld() {
		const island = this.map.addTilesetImage('terrain', 'island-tiles');
		const fort = this.map.addTilesetImage('fort', 'fort-tiles');
		const water = this.map.addTilesetImage('water', 'water-tiles');
		const ship = this.map.addTilesetImage('ships', 'ship-tiles');

		//if (!island || !fort || !water || !ship) return;

		this.map.createLayer('sea', water, 0, 0);
		this.map.createLayer('oversea', water, 0, 0);
		this.map.createLayer('oversea2', water, 0, 0);
		this.map.createLayer('oversea3', water, 0, 0);
		this.map.createLayer('shallows', island, 0, 0);
		this.map.createLayer('islands', [island, fort], 0, 0);
		this.map.createLayer('buildings', fort, 0, 0);
		this.map.createLayer('debris', [island, fort, water, ship], 0, 0);

		//[this.seaLayer, this.shallowsLayer, this.islandsLayer].forEach((l) => l.setCullPadding(2, 2));
	}
}
