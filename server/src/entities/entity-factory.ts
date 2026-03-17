
import EntityRegistry from "../engine/entity-registry";
import { EntityConfig, NPCShipConfig,  PlayerConfig, ShipConfig, ShopConfig } from "../types";
import Entity from "./entity";
import Player from "./player";
import Ship from "./ship";
import Shop from "./shop";
import InteractableEntity from "./interactables/interactable-entity";
import Cannon from "./interactables/cannon";
import Ladder from "./interactables/ladder";
import Helm from "./interactables/helm";
import NPC from "./npcs/npc";
import NPCShip from "./npcs/npc-ship";
import Treasure, { TreasureState } from "./treasure";


export interface InteractableInstance {
    type: string;
    x: number;
    y: number;
}

/**
 * Aggregates entity creation, applying domain-specific default values from
 * the entity-config.json. 
 */
export default class EntityFactory {

    playerConfig: PlayerConfig;
    shipConfig: ShipConfig;
    shopConfig: ShopConfig;
    npcShipConfig: NPCShipConfig;

    /**
     * Builds an entity factory
     * @param entityConfig the default data for new entities
     * @param entityRegistry the repository of entities to add to
     */
    constructor(entityConfig: EntityConfig,
        private entityRegistry: EntityRegistry,) {

        this.playerConfig = entityConfig.player;
        this.shopConfig = entityConfig.shop;
        this.shipConfig = entityConfig.ship;    // destructure
        this.npcShipConfig = entityConfig.npcShip;
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
        const ship = new Ship(id, "ship", x, y, this.shipConfig);
        this.entityRegistry.create(ship);

        this.shipConfig.interactables.forEach((item, index) => {
            this.createInteractable(ship, item, index);
        });

        return ship;
    }

    public createTreasure(
        id: string,
        x: number,
        y: number,
        goldValue: number,
        state: TreasureState = "buried",
        digProgress: number = 0,
        carrierId: string | null = null,
        digSpeed: number = 1,
        successZoneStart: number = 0.4,
        successZoneSize: number = 0.2
    ): Treasure {
        const treasure = new Treasure(
            id,
            x,
            y,
            goldValue,
            state,
            digProgress,
            carrierId,
            digSpeed,
            successZoneStart,
            successZoneSize
        );
        this.entityRegistry.create(treasure);
        return treasure;
    }

    public createInteractable(parent: Ship | null, instance: InteractableInstance, index: number) {
        const { type, x, y } = instance;
        const prefix = parent ? parent.id : "map";  // parent id or map if null
        const id = `${prefix}_${type}_${index}`;

        let item: InteractableEntity;

        switch (type) {
            case 'cannon': item = new Cannon(id, x, y, parent); break;
            case 'ladder': item = new Ladder(id, x, y, parent); break;
            case 'helm': item = new Helm(id, x, y, parent); break;

            default: item = new InteractableEntity(id, x, y, parent);
        }

        if (parent) {
            parent.interactables.push(item);
        }
        this.entityRegistry.create(item);
    }

    public createShop(id: string, x: number, y: number): Shop {
        const shop = new Shop(id, x, y, this.shopConfig);
        this.entityRegistry.create(shop);
        return shop;
    }

    public createNPC(id: string, x: number, y: number): NPC {
        const npc = new NPC(id, "npc", x, y);
        this.entityRegistry.create(npc);
        return npc;
    }

    public createNPCShip(id: string, x: number, y: number): NPCShip {
        const npcShip = new NPCShip(id, x, y, this.npcShipConfig);
        this.entityRegistry.create(npcShip);

        this.npcShipConfig.interactables.forEach((item, index) => {
            this.createInteractable(npcShip, item, index);
        });
        return npcShip;
    }
}