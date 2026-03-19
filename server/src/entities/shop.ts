import Player from "./player";
import { ShopConfig } from "../types";
import InteractableEntity from "./interactables/interactable-entity";


/**
 * The server-side representation of a shop entity. Shops are static, indestructible
 * interactable points on the map that players can approach to buy upgrades.
 */
export default class Shop extends InteractableEntity {

    radius: number;
    interactRange: number;
    texture: string;

    /**
     * Creates a shop with the provided data
     * @param id the id of the shop
     * @param x the (always absolute) x coordinate
     * @param y the (always absolute) y coordinate
     * @param config the shop's configuration from entityConfig
     */
    constructor(
        id: string,
        x: number,
        y: number,
        config: ShopConfig
    ) {
        super(id, x, y, null, 'shop'); // shops have no parents and are indestructible

        this.radius = config.radius;
        this.interactRange = config.interactRange;
        this.texture = config.texture;
    }

    /**
     * Returns true if the player is on foot and within this shop's interact range.
     * @param player the player to check
     */
    canInteract(player: Player): boolean {
        if (player.parent) return false;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.interactRange;
    }
}