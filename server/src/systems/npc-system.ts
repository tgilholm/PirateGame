import TerrainMap from '../engine/terrain-map';
import { BaseSystem } from './base-system';
import EntityRegistry from '../engine/entity-registry';
import NPC from '../entities/npcs/npc';
import EntityFactory from '../entities/entity-factory';
import SpatialGrid from '../application/spatial-grid';
import Entity from '../entities/entity';
import NPCShip from '../entities/npcs/npc-ship';

/**
 * Responsible for creating new NPCs when below the limit. Will be adapted
 * later on to account for the number of players in the world, replacing
 * inactive npcs with players when they are needed.
 */
export default class NPCSystem implements BaseSystem {
	npcLimit: number = 12;
	npcShipLimit: number = 1;

	constructor(
		private terrainMap: TerrainMap,
		private entityFactory: EntityFactory,
		private entityRegistry: EntityRegistry,
		private spatialGrid: SpatialGrid
	) {}

	update(dt: number): void {
		// Get patrol path for ships
		const path = this.terrainMap.npcPath;
		if (path.length === 0) return;

		const allNpcs = this.entityRegistry.getByType<NPC>('npc'); // npc ships included
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
			}
		}
	}

	patrol(ship: NPCShip, path: Array<{ x: number; y: number }>, dt: number): void {
		const current = path[ship.pathIndex];
		const nextIndex = (ship.pathIndex + 1) % path.length;
		const next = path[nextIndex];

		const dx = next.x - current.x;
		const dy = next.y - current.y;
		const segLength = Math.hypot(dx, dy);

		// prevent dividing by 0
		if (segLength === 0) {
			ship.pathIndex = nextIndex;
			return;
		}

		// Move between each segment one at a time
		const moveDistance = ship.patrolSpeed * dt;

		const deltaT = moveDistance / segLength;
		ship.segmentT += deltaT;

		// If close enough, jump to the next segment
		if (ship.segmentT >= 1) {
			ship.segmentT = 0;
			ship.pathIndex = nextIndex;

			ship.x = next.x;
			ship.y = next.y;
		} else {
			// Otherwise move smoothly
			ship.x = current.x + dx * ship.segmentT;
			ship.y = current.y + dy * ship.segmentT;
		}

		ship.r = Math.atan2(dy, dx);
	}

	removeDead(npc: NPC) {
		if (npc.health <= 0) {
			this.spatialGrid.remove(npc.id);
			this.entityRegistry.delete(npc.id);
		}
	}

	getTarget(npc: NPC, nearby: Set<string>) {
		nearby.forEach((id) => {
			const entity = this.entityRegistry.get(id);

			// Only chase players
			if (entity?.type !== 'player') return;

			// Get distance to player
			const dist = Math.hypot(npc.x - entity.x, npc.y - entity.y);
			if (dist < npc.detectionRadius && !entity.isDead) npc.target = entity;
			else npc.target = null;

			if (npc.target && dist < 25) this.attackTarget(npc, npc.target);
		});
	}

	attackTarget(npc: NPC, target: Entity) {
		if (!target.isDead) {
			target.health -= npc.attackDamage;
		}
	}

	generateNPCs(npcs: NPC[]) {
		// Don't include npc ships in count
		const regularNpcs = npcs.filter((n) => !(n instanceof NPCShip));
		if (regularNpcs.length < this.npcLimit) {
			const { x, y } = this.getSpawnPoint();
			this.entityFactory.createNPC(`npc_${Date.now()}`, x, y);
		}
	}

	generateNPCShips(ships: NPCShip[], path: Array<{ x: number; y: number }>): void {
		if (ships.length >= this.npcShipLimit || path.length === 0) return;

		const spawn = path[0];
		this.entityFactory.createNPCShip(`npc-ship_${Date.now()}`, spawn.x, spawn.y);
	}

	getSpawnPoint() {
		// Choose a spawn point for the npc
		const spawnPoints = this.terrainMap.getTileset('npc-spawns');

		// Choose randomly from the list
		return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
	}
}
