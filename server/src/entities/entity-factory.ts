
import EntityRegistry from "src/engine/entity-registry";
import { EntityConfig, PlayerConfig, ShipConfig, ShopConfig } from "../types";
import Entity from "./entity";
import Player from "./player";
import Ship from "./ship";
import Shop from "./shop";
import PhysicsSystem from "src/systems/physics-system";
import TerrainMap from "src/engine/terrain-map";


/**
 * Aggregates entity creation, applying domain-specific default values from
 * the entity-config.json. 
 */
export default class EntityFactory {

    playerConfig: PlayerConfig;
    shipConfig: ShipConfig;
    shopConfig: ShopConfig;
    constructor(private entityConfig: EntityConfig,
        private entityRegistry: EntityRegistry,
        private physicsSystem: PhysicsSystem,
        private terrainMap: TerrainMap) {

        this.playerConfig = entityConfig.player;
        this.shipConfig = entityConfig.ship;
        this.shopConfig = entityConfig.shop;
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

    //spawns shops
    public createShops(): Shop[] {
        const shopConfig = this.entityConfig.shop;
        return shopConfig.spawns.map((spawn, i) => {
            const shop = new Shop(shopConfig.id + "_" + i, spawn.X, spawn.Y, shopConfig, this.terrainMap.tileWidth);
            this.entityRegistry.create(shop);
            return shop;
        });
    }

    // public createNPC(): NPC {
    //     return new 
    // }

}