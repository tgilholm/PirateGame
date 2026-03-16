import TerrainMap from "src/engine/terrain-map";
import { BaseSystem } from "./base-system";
import EntityRegistry from "src/engine/entity-registry";
import EntityFactory from "src/entities/entity-factory";
import SpatialGrid from "src/application/spatial-grid";
import Shop from "src/entities/shop";

/**
 * Responsible for creating shops
 */
export default class ShopSystem implements BaseSystem {

    constructor(private terrainMap: TerrainMap,
        private entityFactory: EntityFactory,
        private entityRegistry: EntityRegistry,
        private spatialGrid: SpatialGrid
    ) {
        this.generateShops();
    }

    update(dt: number): void {
        // Check their proximity to a player
        const shops = this.entityRegistry.getByType<Shop>('shop');
        for (let i = 0; i < shops.length; i++) {
            const shop = shops[i];
            const nearby = this.spatialGrid.getNearby(shop.x, shop.y);
        }
    }


    generateShops() {
        let spawnPoints = this.getSpawnPoint();

        if (spawnPoints.length === 0) {
            console.warn(`[ShopSystem] No shop-spawns layer found, using entity-config spawns`);
            spawnPoints = this.entityFactory.shopConfig.spawns.map(s => ({ worldX: s.x, worldY: s.y }));
        }

        for (const { worldX, worldY } of spawnPoints) {
            this.entityFactory.createShop("shop_" + worldX + "_" + worldY, worldX, worldY);
            console.log("[ShopSystem] Created shop at" + worldX, worldY);
        }
    }

    getSpawnPoint() {
        const spawnPoints = this.terrainMap.getTileset('shop-spawns');
        return spawnPoints;
    }
}