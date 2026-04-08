import { StartScene } from './start-scene.js';
import { MainScene } from './main-scene.js';

// Replace the div with the actual game canvas
const parent = document.getElementById('game-container');

// Set up game
const config = {
	type: Phaser.AUTO,
	width: window.innerWidth, // doesn't account for resize yet
	height: window.innerHeight,
	roundPixels: false,
	pixelArt: true,
	backgroundColor: '#2d80c9',
	parent: parent,
	scene: [StartScene, MainScene], // Add all scenes in

	render: {
		mipmapFilter: 'NEAREST',
		antialias: true,
		premultipliedAlpha: false,
	},

	physics: {
		default: 'matter', // for complex physics
		matter: {
			gravity: { x: 0, y: 0 },
			debug: false,
		},
	},
};

const showDebug = false;

// Get any files from the shared directory
const entityConfig = await fetch('/shared/entity-config.json').then((r) => r.json());
// @ts-ignore cheesing here
window.entityConfig = entityConfig;

const upgradeConfig = await fetch('/shared/upgrade-config.json').then((r) => r.json());

//@ts-ignore
window.upgradeConfig = upgradeConfig;

//@ts-ignore more cheesing
window.showDebug = showDebug;
const game = new Phaser.Game(config);
