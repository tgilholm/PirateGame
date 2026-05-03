import TerrainMap from '../engine/terrain-map';
import { BaseSystem } from './base-system';
import EntityRegistry from '../engine/entity-registry';
import NPC from '../entities/npcs/npc';
import EntityFactory from '../entities/entity-factory';
import SpatialGrid from '../application/spatial-grid';
import Entity from '../entities/entity';
import NPCShip from '../entities/npcs/npc-ship';
import Money from 'src/entities/interactables/money';
import Ship from 'src/entities/ship';
import { Body } from 'matter-js';

/**
 * Responsible for creating new NPCs when below the limit. Will be adapted
 * later on to account for the number of players in the world, replacing
 * inactive npcs with players when they are needed.
 */
export default class NPCSystem implements BaseSystem {
	npcLimit: number = 12;
	npcShipPaths: Map<string, NPCShip> = new Map(); // maps ships to path ids

	constructor(
		private terrainMap: TerrainMap,
		private entityFactory: EntityFactory,
		private entityRegistry: EntityRegistry,
		private spatialGrid: SpatialGrid,
		private addPhysicsBody: (body: Matter.Body) => void
	) {}

	generateNPCShip(path: Array<{ x: number; y: number }>): NPCShip | null {
		if (path.length === 0) return null;

		const spawn = path[Math.floor(Math.random() * path.length - 1)]; // so it's not the same every time
		const ship = this.entityFactory.createNPCShip(`npc-ship_${Date.now()}`, spawn.x, spawn.y);
		this.addPhysicsBody(ship.body);

		console.log(`[NPCSystem] Creating NPC Ship`);

		return ship;
	}

	update(dt: number): void {
		const paths = this.terrainMap.npcPaths; // map of ship name to coordinates

		paths.forEach((value, key) => {
			const current = this.npcShipPaths.get(key);

			if (!current) {
				const ship = this.generateNPCShip(value); // set the ship on those coords

				if (!ship) {
					console.warn(`[NPCSystem] Failed to generate NPC ship`);
					return;
				}

				this.npcShipPaths.set(key, ship); // so we don't add it again
			}

			// no need to create anything new
		});

		const allNpcs = this.entityRegistry.getByType<NPC>('npc'); // npc ships included

		// Generate if disappeared
		this.generateNPCs(allNpcs);

		for (const npc of allNpcs) {
			this.reap(npc);

			if (npc instanceof NPCShip) {
				this.patrol(npc, paths.get(npc.pathName), dt);
			} else {
				const nearby = this.spatialGrid.getNearby(npc.x, npc.y);
				this.getTarget(npc, nearby);
				this.updateTimer(npc, dt);
			}
		}
	}

	updateTimer(npc: NPC, dt: number) {
		// npcs can only attack when the timer hits 0
		if (npc.attackTimer > 0) {
			npc.attackTimer = Math.max(0, npc.attackTimer - dt * 1000);
			npc.markDirty();
		}
	}

	patrol(ship: NPCShip, path: Array<{ x: number; y: number }> | undefined, dt: number): void {
		if (!path) return;

		const current = path[ship.pathIndex];
		const nextIndex = (ship.pathIndex + 1) % path.length;
		const next = path[nextIndex];

		const dx = next.x - current.x;
		const dy = next.y - current.y;
		const segLength = Math.hypot(dx, dy);

		// prevent dividing by 0 with a 20px threshold
		if (segLength < 20) {
			//
			ship.pathIndex = nextIndex;
			return;
		}

		// Move between each segment one at a time
		const moveDistance = ship.patrolSpeed * dt;

		const deltaT = moveDistance / segLength;
		ship.segmentT += deltaT;

		let x, y;

		// If close enough, jump to the next segment
		if (ship.segmentT >= 1) {
			ship.segmentT = 0;
			ship.pathIndex = nextIndex;

			x = next.x;
			y = next.y;
		} else {
			// Otherwise move smoothly
			x = current.x + dx * ship.segmentT;
			y = current.y + dy * ship.segmentT;
		}

		// Update physics body, not the actual ship
		// physicsSystem handles that separately
		Body.setPosition(ship.body, { x: x, y: y });
		Body.setAngle(ship.body, Math.atan2(dy, dx));
	}

	reap(npc: NPC) {
		if (npc.health <= 0) {
			this.spatialGrid.remove(npc.id);
			this.entityRegistry.delete(npc.id);

			// Spawn money stack at the death point
			const money = this.entityFactory.createInteractable(
				npc.parent as Ship | null,
				{ type: 'money', x: npc.x, y: npc.y },
				npc.id
			) as Money;

			money.value = Math.floor(Math.random() * 100) + (npc instanceof NPCShip ? 5000 : 50); // avoid floating point money
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

			if (npc.target && dist < 25 && npc.canAttack) {
				this.attackTarget(npc, npc.target);
				npc.attackTimer = npc.attackTime; // reset cooldown
			}
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

	getSpawnPoint() {
		// Choose a spawn point for the npc
		const spawnPoints = this.terrainMap.getObjectLayer('npc-spawns');

		// Choose randomly from the list
		return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
	}
}
