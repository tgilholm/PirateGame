
import { EntityConfig, PlayerConfig, ShipConfig } from "../types";
import Player from "./player";
import Ship from "./ship";


/**
 * Aggregates entity creation, applying domain-specific default values from
 * the entity-config.json. 
 */
export default class EntityFactory {

    playerConfig: PlayerConfig;
    shipConfig: ShipConfig;

    constructor(private entityConfig : EntityConfig) { 
        this.playerConfig = entityConfig.player;
        this.shipConfig = entityConfig.ship;
    }

    public createPlayer(id: string, x: number, y: number, parentId: string | null, username: string): Player {
        return new Player(id, x, y, parentId, username, this.playerConfig);
    }

    public createShip(id: string, x: number, y: number): Ship {
        return new Ship(id,
            x,
            y,
            this.shipConfig
        );
    }

    // public createNPC(): NPC {
    //     return new 
    // }

}