import TerrainMap from "../engine/terrain-map";
import { BaseSystem } from "./base-system";
import EntityRegistry from "../engine/entity-registry";
import NPC from "../entities/npcs/npc";
import EntityFactory from "../entities/entity-factory";
import SpatialGrid from "../application/spatial-grid";
import Entity from "../entities/entity";
import NPCShip from "../entities/npcs/npc-ship";

/**
 * Responsible for creating new NPCs when below the limit. Will be adapted
 * later on to account for the number of players in the world, replacing
 * inactive npcs with players when they are needed.
 */
export default class NPCSystem implements BaseSystem {

    npcLimit: number = 12;
    npcShipLimit: number = 0;

    constructor(private terrainMap: TerrainMap,
        private entityFactory: EntityFactory,
        private entityRegistry: EntityRegistry,
        private spatialGrid: SpatialGrid
    ) {

    }

    update(dt: number): void {
        // Get patrol path for ships
        const path = this.terrainMap.npcPath;
        if (path.length === 0) return;

        const allNpcs = this.entityRegistry.getByType<NPC>('npc');  // npc ships included
        const ships = this.entityRegistry.getByType<NPCShip>('npc-ship'); // just ships


        // Generate if disappeared
        this.generateNPCs(allNpcs);
        this.generateNPCShips(ships, path);

        for (const npc of allNpcs) {
            this.removeDead(npc);

            if (npc instanceof NPCShip) {
                this.patrol(npc, path, dt);

            } else {
                const nearby = this.spatialGrid.getNearby(npc.x, npc.y);
                this.getTarget(npc, nearby);

                if (npc.target)
                    this.attackTarget(npc, npc.target);
            }
        }
    }


    patrol(ship: NPCShip, path: Array<{ x: number, y: number }>, dt: number): void {
        let moveDistance = ship.patrolSpeed * dt;

        while (moveDistance > 0) {
            const nextIndex = (ship.pathIndex + 1) % path.length;
            const current = path[ship.pathIndex];
            const next = path[nextIndex];

            const dx = next.x - current.x;
            const dy = next.y - current.y;
            const segLength = Math.hypot(dx, dy);

            // How much of this segment is left
            const remaining = segLength * (1 - ship.segmentT);

            if (moveDistance >= remaining) {
                // Consume this segment entirely and move to the next
                moveDistance -= remaining;
                ship.pathIndex = nextIndex;
                ship.segmentT = 0;
            } else {
                // Advance within the segment
                ship.segmentT += moveDistance / segLength;
                ship.x = current.x + dx * ship.segmentT;
                ship.y = current.y + dy * ship.segmentT;
                ship.r = Math.atan2(dy, dx);
                moveDistance = 0;
            }
        }
    }


    removeDead(npc: NPC) {
        if (npc.health <= 0) {
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

    attackTarget(npc: NPC, target: Entity) {
        target.health -= npc.attackDamage;
    }


    generateNPCs(npcs: NPC[]) {
        // Don't include npc ships in count
        const regularNpcs = npcs.filter(n => !(n instanceof NPCShip));
        if (regularNpcs.length < this.npcLimit) {
            const { x, y } = this.getSpawnPoint();
            this.entityFactory.createNPC(`npc_${Date.now()}`, x, y);
            console.log(`[NPCSystem] Created NPC at ${x}, ${y}`);
        }
    }

    generateNPCShips(ships: NPCShip[], path: Array<{ x: number, y: number }>): void {
        if (ships.length >= this.npcShipLimit || path.length === 0) return;

        const spawn = path[0];
        this.entityFactory.createNPCShip(`npc-ship_${Date.now()}`, spawn.x, spawn.y);

        console.log(`[NPCSystem] Created NPC Ship at ${spawn.x}, ${spawn.y}`);
    }


    getSpawnPoint() {
        // Choose a spawn point for the npc
        const spawnPoints = this.terrainMap.getTileset('npc-spawns');

        // Choose randomly from the list
        return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    }
}