import Interactable from './interactables/interactable';

/**
 * The server-side representation of a shop entity. Shops are static, indestructible
 * interactable points on the map that players can approach to buy upgrades.
 */
export default class Shop extends Interactable {
	public radius: number = 16;

	/**
	 * Creates a shop with the provided data
	 * @param id the id of the shop
	 * @param x the (always absolute) x coordinate
	 * @param y the (always absolute) y coordinate
	 * @param config the shop's configuration from entityConfig
	 */
	constructor(id: string, x: number, y: number) {
		super(id, x, y, null, 'shop'); // shops have no parents and are indestructible
		this.interactRange = 32;
	}
}
