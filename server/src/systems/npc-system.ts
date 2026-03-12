import TerrainMap from "src/engine/terrain-map";
import { BaseSystem } from "./base-system";
import EntityRegistry from "src/engine/entity-registry";
import NPC from "src/entities/npc";
import EntityFactory from "src/entities/entity-factory";

/**
 * Responsible for creating new NPCs when below the limit. Will be adapted
 * later on to account for the number of players in the world, replacing
 * inactive npcs with players when they are needed.
 */
export default class NPCSystem implements BaseSystem {

    npcLimit: number = 16;

    constructor(private terrainMap: TerrainMap,
        private entityFactory: EntityFactory,
        private entityRegistry: EntityRegistry
    ) {

    }

    update(dt: number): void {
        // Get all npcs
        const npcs = this.entityRegistry.getByType<NPC>('npc');

        if (npcs && npcs.length < this.npcLimit)
        {
            const {worldX, worldY} = this.getSpawnPoint();
            
            const npc = this.entityFactory.createNPC(`npc_${Date.now()}`, worldX, worldY);
            console.log(`[NPCSystem] Created NPC at ${worldX}, ${worldY}`);
        }
    }

    
    getSpawnPoint() {
        // Choose a spawn point for the npc
        const spawnPoints = this.terrainMap.getSpawnTiles();
        
        // Choose randomly from the list
        return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    }
}