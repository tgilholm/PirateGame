import Entity from "./entity";
import Player from "./player";
import { ShopConfig } from "../types";

//canInteract is mirrored server and client side to show/hide prompts locally, but prevent server-side tampering
export default class Shop extends Entity {

    public readonly radius: number;
    public readonly interactRange: number;

    /**
     * @param id unique id, e.g. (shop_0, shop_1, ...)
     * @param tileX tile column - (entity-config SHOP.SPAWNS[n].X)
     * @param tileY tile row - (entity-config SHOP.SPAWNS[n].Y)
     * @param config entity-config SHOP section
     * @param tileWidth pixels per tile
     */
    constructor(id: string, tileX: number, tileY: number, config: ShopConfig, tileWidth: number) {

        //tile-to-pixel conversion
        const worldX = (tileX + 0.5) * tileWidth;
        const worldY = (tileY + 0.5) * tileWidth;

        super(id, config.type, worldX, worldY, Infinity, null);

        this.radius = config.radius;
        this.interactRange = config.interactRange;
    }

    //returns if player is can interact with shop, server-side mirrors client-side interation checks
    canInteract(player: Player): boolean {
        if (player.parent) return false; //must be on foot

        const dx = this.x - player.x;
        const dy = this.y - player.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.interactRange; //pythagorean pixel distance must be < or = interactRange
    }

    serialise() { //override, otherwise it doesnt like using radius and interactRange client side
        return {
            ...super.serialise(),
            radius: this.radius,
            interactRange: this.interactRange,
        };
    }
}
