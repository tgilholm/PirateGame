import Entity from "./entity";
import { ShopConfig } from "../types";


/**
 * The server-side representation of a shop entity. Shops are static, indestructible
 * interactable points on the map that players can approach to buy upgrades.
 */
export default class Shop extends Entity {

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
        super(id, "shop", x, y, Infinity, null); // shops have no parents and are indestructible

        this.radius = config.radius;
        this.interactRange = config.interactRange;
        this.texture = config.texture;
    }
}