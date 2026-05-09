import TerrainMap from '../engine/terrain-map';
import { BaseSystem } from './base-system';
import EntityRegistry from '../engine/entity-registry';
import NPC from '../entities/npcs/npc';
import EntityFactory from '../entities/entity-factory';
import SpatialGrid from '../application/spatial-grid';
import Entity from '../entities/entity';
import NPCShip from '../entities/npcs/npc-ship';
import Money from '../entities/interactables/money';
import Ship from '../entities/ship';
import { Body } from 'matter-js';
import Interactable from '../entities/interactables/interactable';
import Cannon from '../entities/interactables/cannon';
import { lineIntersectsRotatedRect } from '../utils/liang-barsky';
import CombatHandler from '../handlers/combat-handler';

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
		private combatHandler: CombatHandler,
		private addPhysicsBody: (body: Matter.Body) => void
	) {
		this.npcLimit = terrainMap.getObjectLayer('npc-spawns').length; // add npc respawn timer
	}

	generateNPCShip(path: Array<{ x: number; y: number }>, index: string = ''): NPCShip | null {
		if (path.length === 0) return null;

		const spawn = path[Math.floor(Math.random() * path.length)]; // so it's not the same every time
		const ship = this.entityFactory.createNPCShip(`npc-ship_${Date.now()}_${index}`, spawn.x, spawn.y);
		this.addPhysicsBody(ship.body);

		return ship;
	}

	update(dt: number): void {
		const paths = this.terrainMap.npcPaths; // map of ship name to coordinates

		paths.forEach((value, key) => {
			const current = this.npcShipPaths.get(key);

			if (!current) {
				const ship = this.generateNPCShip(value, key); // set the ship on those coords

				if (!ship) {
					console.warn(`[NPCSystem] Failed to generate NPC ship`);
					return;
				}

				this.npcShipPaths.set(key, ship); // so we don't add it again
				ship.pathName = key;
			}

			// no need to create anything new
		});

		const allNpcs = this.entityRegistry.getByType<NPC>('npc'); // npc ships included

		// Generate if disappeared
		this.generateNPCs(allNpcs);

		for (const npc of allNpcs) {
			if (!npc.isDead) {
				const nearby = this.spatialGrid.getNearby(npc.x, npc.y);
				this.reap(npc);
				this.getTarget(npc, nearby);
				this.updateTimer(npc, dt);

				if (npc instanceof NPCShip) {
					this.fireCannons(npc, npc.target);
					this.patrol(npc, paths.get(npc.pathName), dt);
				} else {
					// non-ship NPCs

					if (npc.target) {
						this.attackTarget(npc, npc.target);
					} else {
						this.getPatrolTarget(npc);
						this.moveToPatrolTarget(npc, dt);
					}
				}
			}
		}
	}

	updateTimer(npc: NPC, dt: number) {
		// npcs can only attack when the timer hits 0
		if (npc.attackTimer > 0) {
			npc.attackTimer = Math.max(0, npc.attackTimer - dt * 1000);
			if (npc.attackTimer <= 0) {
				npc.isAttacking = false;
			}
			npc.markDirty();
		}
	}

	moveToPatrolTarget(npc: NPC, dt: number) {
		if (npc.target || npc.parent) return; // chasing player
		if (!npc.hasPatrolTarget) return;

		const { patrolPointX, patrolPointY } = npc;

		const dx = patrolPointX - npc.x;
		const dy = patrolPointY - npc.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		// Calculate frame-independent movement step
		const step = npc.speed * dt;

		// snap to target if close
		if (dist <= step) {
			npc.x = patrolPointX;
			npc.y = patrolPointY;
			npc.clearPatrolTarget();
			npc.markDirty();
			return;
		}

		// angle to target
		const angle = Math.atan2(dy, dx);

		npc.x += Math.cos(angle) * step;
		npc.y += Math.sin(angle) * step;

		npc.markDirty();
	}

	getPatrolTarget(npc: NPC) {
		if (npc.target || npc.parent) return;
		if (npc.hasPatrolTarget) return;

		// Get all coordinates around the npc
		const coords = this.terrainMap.getTileset('islands').filter((tile) => {
			const dx = tile.x - npc.x;
			const dy = tile.y - npc.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			return dist < 250;
		});

		const dest = coords[Math.floor(Math.random() * coords.length)];

		const dist = Math.sqrt((npc.x - dest.x) ** 2 + (npc.y - dest.y) ** 2);

		if (dist > 32) {
			// only move if reasonably far away
			npc.patrolPointX = dest.x;
			npc.patrolPointY = dest.y;
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

		if (segLength < 0.01) {
			ship.pathIndex = nextIndex;
			ship.segmentT = 0; // reset so next segment starts clean
			return;
		}

		const moveDistance = ship.patrolSpeed * dt;
		ship.segmentT += moveDistance / segLength;

		let x, y;

		if (ship.segmentT >= 1) {
			ship.segmentT -= 1; // carry remainder into next segment
			ship.pathIndex = nextIndex;

			x = next.x;
			y = next.y;
		} else {
			x = current.x + dx * ship.segmentT;
			y = current.y + dy * ship.segmentT;
		}

		Body.setPosition(ship.body, { x, y });
		Body.setAngle(ship.body, Math.atan2(dy, dx));
	}

	// Fire all cannons in range of the player's ship
	fireCannons(npc: NPCShip, target: Entity | null) {
		if (!target) return;

		// Fire each cannon in range
		npc.interactables
			.filter((item: Interactable) => item.type === 'cannon')
			.forEach((c, index) => {
				const cannon = c as Cannon;
				const angle = cannon.r + npc.r; // expected projectile angle, account for ship rotation
				const speed = cannon.cannonballSpeed;
				const time = 1500; // cannonball ttl - magic number needs moving of course

				const x = cannon.worldPos.x;
				const y = cannon.worldPos.y;

				/*
				Calculate the endpoint of the line given the speed and time
			*/
				const p0 = { x: x, y: y };
				const p1 = {
					x: x + Math.cos(angle) * speed * (time / 1000),
					y: y + Math.sin(angle) * speed * (time / 1000),
				};

				let width;
				let height;
				if (target instanceof Ship) {
					const { middleWidth, bowLength, sternRadius } = target.dimensions;
					width = middleWidth + bowLength + sternRadius;
					height = target.dimensions.height;
				} else {
					width = 15;
					height = 15; // change to actual width of entity
				}

				const rect = {
					minX: target.x - width / 2,
					minY: target.y - height / 2,
					maxX: target.x + width / 2,
					maxY: target.y + height / 2,
					angle: npc.r,
				};

				const intersect = lineIntersectsRotatedRect(p0, p1, rect);
				if (intersect) {
					// fire the cannon
					this.combatHandler.handleCannonFire(cannon, npc, index);
				}
			});
	}

	reap(npc: NPC) {
		if (npc.health <= 0 && !npc.isDying) {
			npc.isDying = true; // flag to prevent double-reap
			npc.markDirty(); // tell client to play death anim

			// Delay removal to let death animation finish (~1 second)
			setTimeout(() => {
				this.spatialGrid.remove(npc.id);
				this.entityRegistry.delete(npc.id);

				if (npc instanceof NPCShip) {
					this.npcShipPaths.delete(npc.pathName);
				}

				const money = this.entityFactory.createInteractable(
					npc.parent as Ship | null,
					{ type: 'money', x: npc.x, y: npc.y },
					npc.id
				) as Money;

				money.value = Math.floor(Math.random() * 100) + (npc instanceof NPCShip ? 5000 : 50);
			}, 1000); // match skeleton death anim duration
		}
	}

	getTarget(npc: NPC, nearby: Set<string>) {
		npc.target = null; // reset target

		if (npc.isDead) return;

		for (const id of nearby) {
			const entity = this.entityRegistry.get(id);
			if (!entity || entity.isDead) continue;

			// ships can attack both
			// skeletons, only players
			if (npc.type === 'npc-ship' && !['player', 'ship'].includes(entity.type)) continue;
			if (npc.type === 'npc' && entity.type !== 'player') continue;

			const dist = Math.hypot(npc.x - entity.x, npc.y - entity.y);
			if (dist < npc.detectionRadius) {
				// Ships target regardless of terrain
				if (npc.type === 'npc-ship') {
					npc.target = entity;
					break;
				}

				// Skeletons (npc type)
				if (npc.type === 'npc') {
					const onSameShip = npc.parent && npc.parent === entity.parent;
					const bothOnIsland =
						this.terrainMap.isOnIsland(npc.x, npc.y) && this.terrainMap.isOnIsland(entity.x, entity.y);

					if (onSameShip || bothOnIsland) {
						npc.target = entity;
						break;
					}
				}
			}
		}
	}

	attackTarget(npc: NPC, target: Entity | null) {
		if (!target || npc.parent !== target.parent) return;

		const dist = Math.hypot(npc.x - target.x, npc.y - target.y);

		if (target && dist < 25 && npc.canAttack && !target.isDead && !npc.isDying) {
			npc.attackTimer = npc.attackTime;
			target.health -= npc.attackDamage;
			npc.isAttacking = true;
			npc.markDirty();
		}
	}

	generateNPCs(npcs: NPC[]) {
		// Don't include npc ships in count
		const regularNpcs = npcs.filter((n) => !(n instanceof NPCShip));
		if (regularNpcs.length < this.npcLimit) {
			const { x, y } = this.getSpawnPoint();
			this.entityFactory.createNPC(`npc_${Date.now()}`, x, y, null);
		}
	}

	getSpawnPoint() {
		// Choose a spawn point for the npc
		const spawnPoints = this.terrainMap.getObjectLayer('npc-spawns');

		// Choose randomly from the list
		return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
	}
}
