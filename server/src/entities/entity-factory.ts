
import EntityRegistry from "src/engine/entity-registry";
import { EntityConfig, PlayerConfig, ShipConfig } from "../types";
import Entity from "./entity";
import Player from "./player";
import Ship from "./ship";
import PhysicsSystem from "src/systems/physics-system";


/**
 * Aggregates entity creation, applying domain-specific default values from
 * the entity-config.json. 
 */
export default class EntityFactory {

    playerConfig: PlayerConfig;
    shipConfig: ShipConfig;

    constructor(private entityConfig: EntityConfig,
        private entityRegistry: EntityRegistry,
        private physicsSystem: PhysicsSystem) {

        this.playerConfig = entityConfig.player;
        this.shipConfig = entityConfig.ship;
    }

    public createPlayer(id: string, x: number, y: number, parent: Entity | null, username: string): Player {
        const player = new Player(id, x, y, parent, username, this.playerConfig);
        this.entityRegistry.create(player);
        return player;
    }

    public createShip(id: string, x: number, y: number): Ship {
        const ship = new Ship(id, x, y, this.shipConfig);
        this.entityRegistry.create(ship);

        ship.interactables.forEach(interactable => {
            this.entityRegistry.create(interactable);
        })

        this.physicsSystem.addBody(ship.body);

        return ship;
    }

    // public createNPC(): NPC {
    //     return new 
    // }

}