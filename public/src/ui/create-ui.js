//import debug-menu from "./debug-menu.js";
import Minimap from './minimap.js';
import GoldCounter from './gold-counter.js';

//Contains UI creation logic
export default class CreateUI {
	/**
	 * @param {Phaser.Scene} scene - The active Phaser scene used to create Phaser text objects and bind keyboard input
	 */
	constructor(scene) {
		this.scene = scene;

		//minimap
		this.minimap = new Minimap(document.getElementById('minimap-container'));

		//gold counter
		this.goldCounter = new GoldCounter(document.getElementById('gold-counter'));
	}
}
