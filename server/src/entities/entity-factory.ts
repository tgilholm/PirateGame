
import { EntityConfig, PlayerConfig, ShipConfig } from "../../types";
import Entity from "./entity";
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

    public createPlayer(x: number, y: number, parent: Entity | null, username: string): Player {
        return new Player(x, y, parent, username, this.playerConfig);
    }

    public createShip(x: number, y: number): Ship {
        return new Ship(x,
            y,
            this.shipConfig
        );
    }

    // public createNPC(): NPC {
    //     return new 
    // }

}