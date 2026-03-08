
import EntityRegistry from "src/engine/entity-registry";
import { EntityConfig, PlayerConfig, ShipConfig } from "../types";
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

    /**
     * Builds an entity factory
     * @param entityConfig the default data for new entities
     * @param entityRegistry the repository of entities to add to
     */
    constructor(private entityConfig: EntityConfig,
        private entityRegistry: EntityRegistry,) {

        this.playerConfig = entityConfig.player;
        this.shipConfig = entityConfig.ship;    // destructure
    }

    /**
     * Creates a player with the specified data, injects the default player config and adds to the entity registry
     * @param id the id of the player
     * @param x the starting x of the player (relative if parent != null)
     * @param y the starting y of the player (relative if parent != null)
     * @param parent an optional physics parent entity
     * @param username the username chosen by the player
     * @returns the player
     */
    public createPlayer(id: string, x: number, y: number, parent: Entity | null, username: string): Player {
        const player = new Player(id, x, y, parent, username, this.playerConfig);
        this.entityRegistry.create(player);
        return player;
    }

    /**
     * Creates a ship with the specified data, injects the default ship config and adds to the entity registry. Note
     * that this does not add a matter-js physics body to the world yet.
     * @param id the id of the ship
     * @param x the absolute x coordinate of the ship
     * @param y the absolute y coordinate of the ship
     * @returns the ship
     */
    public createShip(id: string, x: number, y: number): Ship {
        const ship = new Ship(id, x, y, this.shipConfig);
        this.entityRegistry.create(ship);

        ship.interactables.forEach(interactable => {    // Add all interactable objects to the ship
            this.entityRegistry.create(interactable);
        })

        return ship;
    }
}