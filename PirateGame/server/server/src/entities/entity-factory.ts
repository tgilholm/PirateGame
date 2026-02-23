import NPC from "./npc";
import Player from "./player";

/**
 * Aggregates entity creation, applying domain-specific default values from
 * the passed-in JSON
 */
export default class EntityFactory {

    entityConfig: any = JSON.parse("entity-config.json");

    constructor() {}

    public createPlayer(id: string, x: number, y: number, parentId: string | null, username: string): Player {
        const playerConfig = this.entityConfig.player
        return new Player(id, x, y, parentId, username, playerConfig.max_health);
    }

    // public createShip(): Ship {

    // }

    // public createNPC(): NPC {
    //     return new 
    // }

}