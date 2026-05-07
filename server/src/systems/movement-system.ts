import { Body } from 'matter-js';
import EntityRegistry from '../engine/entity-registry';
import TerrainMap from '../engine/terrain-map';
import Player from '../entities/player';
import Ship from '../entities/ship';
import { EntityConfig } from '../types';
import { BaseSystem } from './base-system';
import Entity from '../entities/entity';
import Cannon from '../entities/interactables/cannon';
import NPC from '../entities/npcs/npc';
import { TreasureState } from '@shared/socket-protocol';
import Treasure from '../entities/interactables/treasure';
import Shop from '../entities/shop';
import NPCShip from '../entities/npcs/npc-ship';

// Players that have moved beyond this threshold are marked "dirty"
const POS_THRESHOLD = 0.5;
const MAX_CANNON_SPEED = 20 * (Math.PI / 180); // cannons move towards mouse
const CANNON_ARC = Math.PI / 4; // 90 deg
const CHEST_OBSTACLE_RADIUS = 8; // loose + dugup chests
const HOLE_OBSTACLE_RADIUS = 8; // open holes
const HOLE_OBSTACLE_RADIUS_Y = 6;

/**
 * Contains all movement logic for moving entities
 */
export default class MovementSystem implements BaseSystem {
	/**
	 * Creates a movement system from the provided data
	 * @param registry the repository of entities from which to update moving ones
	 * @param entityConfig for taking movement parameters
	 * @param terrainMap to apply different movement speed for player
	 */
	constructor(
		private registry: EntityRegistry,
		private entityConfig: EntityConfig,
		private terrainMap: TerrainMap
	) {}

	/**
	 * Updates all the moving entities
	 * @param dt the difference in time from the last update
	 */
	update(dt: number): void {
		const players = this.registry.getByType<Player>('player');
		const cannons = this.registry.getByType<Cannon>('cannon');
		const ships = this.registry.getByType<Ship>('ship');
		const npcs = this.registry.getByType<NPC>('npc');

		ships.forEach((ship) => this.updateShip(ship, dt));
		players.forEach((player) => this.updatePlayer(player, dt, ships));
		cannons.forEach((cannon) => this.updateCannon(cannon, dt));
		npcs.forEach((npc) => this.updateNPC(npc, dt));
	}

	updateReloadTimer(player: Player, dt: number) {
		if (player.reloadTimer > 0) {
			player.reloadTimer = Math.max(0, player.reloadTimer - dt * 1000);
			player.markDirty();
		}
	}

	updateRespawnTimer(player: Player, dt: number) {
		// move to own system
		if (player.respawnTimer > 0 && player.respawnStarted) {
			player.respawnTimer = Math.max(0, player.respawnTimer - dt * 1000);
			player.markDirty();
		}
	}

	updateDashTimer(player: Player, dt: number) {
		if (player.dashTimer > 0) {
			player.dashTimer = Math.max(0, player.dashTimer - dt * 1000);
			if (player.dashTimer <= 0) {
				player.isDashing = false;
				player.dashVx = 0;
				player.dashVy = 0;
			}
			player.markDirty();
		}

		if (player.dashCooldown > 0) {
			player.dashCooldown = Math.max(0, player.dashCooldown - dt * 1000);
			player.markDirty();
		}
	}

	/**
	 * Applies movement for a given player, accounting for on-ship conditions,
	 * different movement speed for on-land vs in-sea, collision with inner/outer
	 * ship hull and with world edge (AABB)
	 * @param player the player for which to apply movement
	 * @param dt the difference in time from the last update
	 */
	updatePlayer(player: Player, dt: number, ships: Ship[]): void {
		this.updateReloadTimer(player, dt);
		this.updateRespawnTimer(player, dt);
		this.updateDashTimer(player, dt);

		// Keep track of aim angle- don't send for static players
		const prevAimAngle = (player as any).prevAimAngle ?? player.aimAngle;

		if (Math.abs(player.aimAngle - prevAimAngle) > 0.01) {
			player.markDirty();
		}
		(player as any).prevAimAngle = player.aimAngle; // store temporarily

		const parent = (player.parent as Ship) || null;

		if (player.isSteering || player.cannon) return;

		const currentWorldPos = player.worldPos;
		const swimmingNow = !parent && !this.terrainMap.isOnIsland(currentWorldPos.x, currentWorldPos.y);
		if (player.isSwimming !== swimmingNow) {
			player.isSwimming = swimmingNow;
			player.markDirty();
		}

		const { up, down, left, right } = player.inputs;
		const playerConfig = this.entityConfig.player;

		// If the player is on a ship
		if (!parent) {
			// Handle "shoving" the player away from moving ships
			for (const ship of ships) {
				const pushPadding = -playerConfig.radius - 2;
				const local = ship.worldToLocal(player.x, player.y);

				if (ship.isInside(local.x, local.y, pushPadding)) {
					const angleToPlayer = Math.atan2(local.y, local.x);
					const shoveDistance = 5;

					local.x += Math.cos(angleToPlayer) * shoveDistance;
					local.y += Math.sin(angleToPlayer) * shoveDistance;

					const correctedWorld = ship.localToWorld(local.x, local.y);
					player.x = correctedWorld.x;
					player.y = correctedWorld.y;
				}
			}
		}

		let dx = 0;
		let dy = 0;
		if (up) dy -= 1;
		if (down) dy += 1;
		if (left) dx -= 1;
		if (right) dx += 1;

		const prevX = player.x;
		const prevY = player.y;

		if (player.isDashing) {
			const nextX = player.x + player.dashVx * dt;
			const nextY = player.y + player.dashVy * dt;

			const groundTreasures = this.registry
				.getByType<Treasure>('treasure')
				.filter((t) => t.id !== player.carrying?.id);
			const shops = this.registry.getByType<Shop>('shop');
			const collisionPadding = -playerConfig.radius;

			const isColliding = (x: number, y: number) =>
				this.checkShipCollisions(x, y, ships, collisionPadding) ||
				this.checkTreasureObstacles(x, y, groundTreasures, playerConfig.radius) ||
				this.checkShopObstacles(x, y, shops, playerConfig.radius) ||
				this.checkPalmTreeObstacles(x, y, playerConfig.radius);

			if (!isColliding(nextX, nextY)) {
				player.x = nextX;
				player.y = nextY;
			} else if (!isColliding(nextX, player.y)) {
				player.x = nextX;
			} else if (!isColliding(player.x, nextY)) {
				player.y = nextY;
			} else {
				// blocked = kill dash
				player.isDashing = false;
				player.dashVx = 0;
				player.dashVy = 0;
			}

			this.constrainToWorld(player, playerConfig.radius);
			player.vx = player.dashVx;
			player.vy = player.dashVy;
			player.markDirty();
			return;
		}

		// If no inputs, do nothing
		if (dx === 0 && dy === 0) {
			player.vx = 0;
			player.vy = 0;
			return;
		}

		const length = Math.sqrt(dx * dx + dy * dy);
		dx /= length;
		dy /= length;

		// Different speed if on land/a ship vs in the sea
		const onLand = this.terrainMap.isOnIsland(player.worldPos.x, player.worldPos.y);
		let runSpeed = playerConfig.runSpeed;
		let swimSpeed = playerConfig.swimSpeed;
		if (player.carrying) {
			runSpeed /= 2;
			swimSpeed /= 2;
		}
		const speedMultiplier = parent || onLand ? runSpeed : swimSpeed;
		const speed = speedMultiplier * dt * 60;

		if (parent) {
			const cos = Math.cos(-parent.r);
			const sin = Math.sin(-parent.r);
			const localDX = (dx * cos - dy * sin) * speed;
			const localDY = (dx * sin + dy * cos) * speed;

			const nextX = player.x + localDX;
			const nextY = player.y + localDY;

			const padding = playerConfig.radius;

			if (parent.isInside(nextX, nextY, padding)) {
				player.x = nextX;
				player.y = nextY;
			} else if (parent.isInside(nextX, player.y, padding)) {
				player.x = nextX;
			} else if (parent.isInside(player.x, nextY, padding)) {
				player.y = nextY;
			}
		} else {
			const nextWorldX = player.x + dx * speed;
			const nextWorldY = player.y + dy * speed;

			const collisionPadding = -playerConfig.radius;

			const groundTreasures = this.registry
				.getByType<Treasure>('treasure')
				.filter((t) => t.id !== player.carrying?.id);

			const shops = this.registry.getByType<Shop>('shop');

			// Collide with exterior of ships
			const isColliding = (x: number, y: number) =>
				this.checkShipCollisions(x, y, ships, collisionPadding) ||
				this.checkTreasureObstacles(x, y, groundTreasures, playerConfig.radius) ||
				this.checkShopObstacles(x, y, shops, playerConfig.radius) ||
				this.checkPalmTreeObstacles(x, y, playerConfig.radius) ||
				this.checkBarrelObstacles(x, y, playerConfig.radius);

			if (!isColliding(nextWorldX, nextWorldY)) {
				player.x = nextWorldX;
				player.y = nextWorldY;
			} else {
				const canMoveX = !isColliding(nextWorldX, player.y);
				const canMoveY = !isColliding(player.x, nextWorldY);

				if (canMoveX) player.x = nextWorldX;
				else if (canMoveY) player.y = nextWorldY;
			}

			this.constrainToWorld(player, playerConfig.radius);
		}

		// Calculate the player's velocity from their new pos vs the old
		player.vx = (player.x - prevX) / dt;
		player.vy = (player.y - prevY) / dt;

		// Mark dirty if position changed enough
		const moved = Math.abs(player.x - prevX) > POS_THRESHOLD || Math.abs(player.y - prevY) > POS_THRESHOLD;

		if (moved) player.markDirty();
	}

	/**
	 * Helper method to contain a non-matter (those are handled automatically) object
	 * inside the border of the world, using an AABB bounding box
	 * @param entity the entity to contain
	 * @param padding the padding around the edge of that entity
	 */
	private constrainToWorld(entity: Entity, padding: number) {
		const minX = padding;
		const minY = padding;
		const maxX = this.terrainMap.widthInPixels - padding;
		const maxY = this.terrainMap.heightInPixels - padding;

		// Bounding box collision- move the entity back inside if it leaves
		if (entity.x < minX) entity.x = minX;
		if (entity.x > maxX) entity.x = maxX;
		if (entity.y < minY) entity.y = minY;
		if (entity.y > maxY) entity.y = maxY;
	}

	/**
	 * Helper method to check if an entity is currently colliding with a ship. Note that this
	 * will only work if the coordinates of both entities are in the same scope- local & local
	 * or global & global.
	 * @param x the x coordinate of the entity
	 * @param y the y coordinate of the entity
	 * @param ships the list of ships
	 * @param padding the padding around an entity
	 * @returns true if colliding, false otherwise
	 */
	private checkShipCollisions(x: number, y: number, ships: Ship[], padding: number): boolean {
		for (const ship of ships) {
			const local = ship.worldToLocal(x, y);
			if (ship.isInside(local.x, local.y, padding)) return true;
		}
		return false;
	}

	/**
	 * Helper method to check if a player is currently colliding with a treasure object. Note that this
	 * will only work if the coordinates of both entities are in the same scope- local & local
	 * or global & global.
	 *
	 */
	private checkTreasureObstacles(x: number, y: number, treasures: Treasure[], playerRadius: number): boolean {
		for (const t of treasures) {
			const worldPos = t.getChestShipPos();
			const dx = x - worldPos.x;
			const dy = y - worldPos.y;

			if (t.state === TreasureState.DROPPED || t.state === TreasureState.DUGUP) {
				const combined = CHEST_OBSTACLE_RADIUS + playerRadius;
				if (dx * dx + dy * dy < combined * combined) return true;
			} else if (t.state === TreasureState.HOLE) {
				//holes are visually wider than tall
				const rx = HOLE_OBSTACLE_RADIUS + playerRadius;
				const ry = HOLE_OBSTACLE_RADIUS_Y + playerRadius;
				if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) < 1) return true;
			}
		}
		return false;
	}

	private checkShopObstacles(x: number, y: number, shops: Shop[], playerRadius: number): boolean {
		for (const s of shops) {
			const dx = x - s.x;
			const dy = y - s.y;
			const distanceSquared = dx * dx + dy * dy;
			const radiusSum = playerRadius + s.radius;

			if (distanceSquared < radiusSum * radiusSum) return true;
		}
		return false;
	}

	private checkPalmTreeObstacles(x: number, y: number, playerRadius: number): boolean {
		const trees = this.registry.getByType('palm-tree');
		const TREE_RADIUS = 12;
		for (const tree of trees) {
			const dx = x - tree.x;
			const dy = y - tree.y;
			if (dx * dx + dy * dy < (TREE_RADIUS + playerRadius) ** 2) return true;
		}
		return false;
	}

	private checkBarrelObstacles(x: number, y: number, playerRadius: number): boolean {
		const barrel = this.registry.getByType('barrel');
		const BARREL_RADIUS = 12;
		for (const barrels of barrel) {
			const dx = x - barrels.x;
			const dy = y - barrels.y;
			if (dx * dx + dy * dy < (BARREL_RADIUS + playerRadius) ** 2) return true;
		}
		return false;
	}

	/**
	 * Updates a given ship's movement by applying force/angular velocity from the provided inputs.
	 * @param ship the ship to update
	 * @param dt the difference in time from the last update
	 */
	updateShip(ship: Ship, dt: number) {
		// Update boost timer
		if (ship.boostTimer > 0) {
			ship.boostTimer = Math.max(0, ship.boostTimer - dt * 1000);
			if (ship.boostTimer <= 0) ship.isBoosting = false;
			ship.markDirty();
		}

		if (ship.boostCooldown > 0) {
			ship.boostCooldown = Math.max(0, ship.boostCooldown - dt * 1000);
			ship.markDirty();
		}

		const body = ship.body;
		const acceleration = ship.acceleration;
		const { up, left, right } = ship.inputs;
		const { turnSpeed } = ship.physics;

		if (right) Body.setAngularVelocity(body, turnSpeed);
		if (left) Body.setAngularVelocity(body, -turnSpeed);

		if (up || ship.isBoosting) {
			const boostFactor = ship.isBoosting ? ship.boostMultiplier : 1;
			const forceX = Math.cos(body.angle) * acceleration * boostFactor;
			const forceY = Math.sin(body.angle) * acceleration * boostFactor;

			const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
			if (ship.isBoosting && speed < 1) {
				Body.setVelocity(body, {
					x: Math.cos(body.angle) * 2,
					y: Math.sin(body.angle) * 2,
				});
			}
			Body.applyForce(body, body.position, { x: forceX, y: forceY });
		}
	}

	updateCannon(cannon: Cannon, dt: number) {
		if (cannon.reloadTimer > 0) {
			cannon.reloadTimer = Math.max(0, cannon.reloadTimer - dt * 1000);
			cannon.markDirty();
		}

		const ship = cannon.parent as Ship | null;
		const facingAngle = cannon.y < 0 ? -Math.PI / 2 : Math.PI / 2; // start angle
		let localTarget: number; // where to aim towards

		if (!cannon.user) {
			localTarget = facingAngle;
		} else {
			localTarget = ship ? cannon.targetAngle - ship.r : cannon.targetAngle;

			while (localTarget > Math.PI) localTarget -= 2 * Math.PI;
			while (localTarget < -Math.PI) localTarget += 2 * Math.PI;

			// clamp to aim cone
			localTarget = Math.max(facingAngle - CANNON_ARC, Math.min(facingAngle + CANNON_ARC, localTarget));
		}

		// move towards whatever target
		let diff = localTarget - cannon.r;
		while (diff > Math.PI) diff -= 2 * Math.PI;
		while (diff < -Math.PI) diff += 2 * Math.PI;

		const maxStep = MAX_CANNON_SPEED * dt;

		// only update if sizable difference
		if (Math.abs(diff) > 0.001) {
			cannon.r += Math.max(-maxStep, Math.min(maxStep, diff));
			cannon.markDirty();
		}
	}

	updateNPC(npc: NPC, dt: number) {
		const target = npc.target;
		const parent = npc.parent as NPCShip | null;

		if (!target) {
			return;
		}

		const npcWorld = parent ? parent.localToWorld(npc.x, npc.y) : { x: npc.x, y: npc.y };

		const targetWorld = target.parent
			? (target.parent as Ship).localToWorld(target.x, target.y)
			: { x: target.x, y: target.y };

		const angle = Math.atan2(targetWorld.y - npcWorld.y, targetWorld.x - npcWorld.x);
		const nextWorldX = npcWorld.x + Math.cos(angle) * npc.speed * dt;
		const nextWorldY = npcWorld.y + Math.sin(angle) * npc.speed * dt;

		if (parent) {
			const newLocal = parent.worldToLocal(nextWorldX, nextWorldY);
			const padding = 8;

			if (parent.isInside(newLocal.x, newLocal.y, padding)) {
				npc.x = newLocal.x;
				npc.y = newLocal.y;
			} else {
				// Slide logic
				npc.x = parent.isInside(newLocal.x, npc.y, padding) ? newLocal.x : npc.x;
				npc.y = parent.isInside(npc.x, newLocal.y, padding) ? newLocal.y : npc.y;
			}
		} else {
			npc.x = nextWorldX;
			npc.y = nextWorldY;
		}

		npc.markDirty();
	}
}
