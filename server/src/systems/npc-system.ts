import TerrainMap from "src/engine/terrain-map";
import { BaseSystem } from "./base-system";
import EntityRegistry from "src/engine/entity-registry";
import NPC from "src/entities/npc";
import EntityFactory from "src/entities/entity-factory";
import SpatialGrid from "src/application/spatial-grid";
import Entity from "src/entities/entity";

/**
 * Responsible for creating new NPCs when below the limit. Will be adapted
 * later on to account for the number of players in the world, replacing
 * inactive npcs with players when they are needed.
 */
export default class NPCSystem implements BaseSystem {

    npcLimit: number = 16;

    constructor(private terrainMap: TerrainMap,
        private entityFactory: EntityFactory,
        private entityRegistry: EntityRegistry,
        private spatialGrid: SpatialGrid
    ) {

    }

    update(dt: number): void {
        // Get all npcs
        const npcs = this.entityRegistry.getByType<NPC>('npc');

        // Create more if needed
        this.generateNPCs(npcs);

        // Check their proximity to a player
        for (let i = 0; i < npcs.length; i++) {
            const npc = npcs[i];
            const nearby = this.spatialGrid.getNearby(npc.x, npc.y);
            this.getTarget(npc, nearby);
            this.removeDead(npc);   // if npc died, remove it
        }
    }


    removeDead(npc: NPC)
    {
        if (npc.health <= 0)
        {
            this.spatialGrid.remove(npc.id);
            this.entityRegistry.delete(npc.id);
        }
    }

    getTarget(npc: NPC, nearby: Set<string>) {

        nearby.forEach(id => {
            const entity = this.entityRegistry.get(id);

            // Only chase players
            if (entity?.type !== 'player') return;

            // Get distance to player
            const dist = Math.hypot(npc.x - entity.x, npc.y - entity.y);
            if (dist < npc.detectionRadius) npc.target = entity
            else npc.target = null;

            if (npc.target && dist < 20) this.attackTarget(npc, npc.target); 
        });
    }

    attackTarget(npc: NPC, target: Entity)
    {
        target.health -= npc.attackDamage;
    }


    generateNPCs(npcs: NPC[]) {

        if (npcs && npcs.length < this.npcLimit) {
            const { worldX, worldY } = this.getSpawnPoint();

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