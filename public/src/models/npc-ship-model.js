import ShipModel from './ship-model.js';

export default class NPCShipModel extends ShipModel {
	/**
	 *
	 * @param {Phaser.Scene} scene
	 * @param {string} id
	 * @param {number} x
	 * @param {number} y
	 * @param {NPCShipConfig} config
	 */
	constructor(scene, id, x, y, config) {
		super(scene, id, x, y, config);
	}
}
