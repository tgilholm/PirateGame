import { Body } from 'matter-js';
import EntityRegistry from '../engine/entity-registry';
import TerrainMap from '../engine/terrain-map';
import Player from '../entities/player';
import Ship from '../entities/ship';
import { EntityConfig } from '../types';
import { BaseSystem } from './base-system';
import Entity from '../entities/entity';
import Cannon from '../entities/interactables/cannon';
import NPC from 'src/entities/npcs/npc';
import Treasure from '../entities/treasure';

// Players that have moved beyond this threshold are marked "dirty"
const POS_THRESHOLD = 0.5;
const MAX_CANNON_SPEED = 20 * (Math.PI / 180); // cannons move towards mouse
const CANNON_ARC = Math.PI / 4; // 90 deg
const CHEST_OBSTACLE_RADIUS = 20; // loose + dugup chests
const HOLE_OBSTACLE_RADIUS = 20; // open holes
const HOLE_OBSTACLE_RADIUS_Y = 12;

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

	/**
	 * Applies movement for a given player, accounting for on-ship conditions,
	 * different movement speed for on-land vs in-sea, collision with inner/outer
	 * ship hull and with world edge (AABB)
	 * @param player the player for which to apply movement
	 * @param dt the difference in time from the last update
	 */
	updatePlayer(player: Player, dt: number, ships: Ship[]): void {
		if (player.reloadTimer > 0) {
			player.reloadTimer = Math.max(0, player.reloadTimer - dt * 1000);
			player.markDirty();
		}

		// Keep track of aim angle- don't send for static players
		const prevAimAngle = (player as any).prevAimAngle ?? player.aimAngle;
		if (Math.abs(player.aimAngle - prevAimAngle) > 0.01) {
			player.markDirty();
		}
		(player as any).prevAimAngle = player.aimAngle; // store temporarily

		if (player.isSteering || player.cannon) return;

		const parent = (player.parent as Ship) || null;
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

		const aimChanged = Math.abs(player.aimAngle - prevAimAngle) > 0.01;
		(player as any).prevAimAngle = player.aimAngle;

		const prevX = player.x; // to calculate velocity difference for client-side extrapolation
		const prevY = player.y;

		// If no inputs, do nothing
		if (dx === 0 && dy === 0) return;

		// Normalize diagonal movement- players move the same speed in all directions
		const length = Math.sqrt(dx * dx + dy * dy);
		dx /= length;
		dy /= length;

		// Different speed if on land/a ship vs in the sea
		const onLand = this.terrainMap.isOnIsland(player.x, player.y);
		let runSpeed = playerConfig.runSpeed;
		let swimSpeed = playerConfig.swimSpeed;
		if (player.isCarrying) {
			runSpeed /= 2;
			swimSpeed /= 2;
		}
		const speedMultiplier = parent || onLand ? runSpeed : swimSpeed;
		const speed = speedMultiplier * dt * 60;

		// Contain the player inside a ship- slide them along the hull if they collide
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
			// Move in absolute scope
			const nextWorldX = player.x + dx * speed;
			const nextWorldY = player.y + dy * speed;

			const collisionPadding = -playerConfig.radius;

			const groundTreasures = this.registry
				.getByType<Treasure>('treasure')
				.filter((t) => t.id !== player.carryingTreasureId);

			// Collide with the exterior of ships
			const isColliding = (x: number, y: number) =>
				this.checkShipCollisions(x, y, ships, collisionPadding) ||
				this.checkTreasureObstacles(x, y, groundTreasures, playerConfig.radius);

			// Move freely if not colliding
			if (!isColliding(nextWorldX, nextWorldY)) {
				player.x = nextWorldX;
				player.y = nextWorldY;
			} else {
				// Slide along the hull
				const canMoveX = !isColliding(nextWorldX, player.y);
				const canMoveY = !isColliding(player.x, nextWorldY);

				if (canMoveX) player.x = nextWorldX;
				else if (canMoveY) player.y = nextWorldY;
			}

			// Keep the player on the map
			this.constrainToWorld(player, playerConfig.radius);
		}

		// Calculate the player's velocity from their new pos vs the old
		player.vx = (player.x - prevX) / dt;
		player.vy = (player.y - prevY) / dt;

		// Mark dirty if position changed enough
		const moved =
			Math.abs(player.x - prevX) > POS_THRESHOLD ||
			Math.abs(player.y - prevY) > POS_THRESHOLD ||
			aimChanged;

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
	private checkTreasureObstacles(
		x: number,
		y: number,
		treasures: Treasure[],
		playerRadius: number
	): boolean {
		for (const t of treasures) {
			const worldPos = t.getChestShipPos();
			const dx = x - worldPos.x;
			const dy = y - worldPos.y;

			if (t.state === 'loose' || t.state === 'dugup') {
				const combined = CHEST_OBSTACLE_RADIUS + playerRadius;
				if (dx * dx + dy * dy < combined * combined) return true;
			} else if (t.state === 'hole') {
				// Ellipse check — holes are visually wider than tall
				const rx = HOLE_OBSTACLE_RADIUS + playerRadius;
				const ry = HOLE_OBSTACLE_RADIUS_Y + playerRadius;
				if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) < 1) return true;
			}
		}
		return false;
	}

	/**
	 * Updates a given ship's movement by applying force/angular velocity from the provided inputs.
	 * @param ship the ship to update
	 * @param dt the difference in time from the last update
	 */
	updateShip(ship: Ship, dt: number) {
		const body = ship.body;
		const sailState = ship.sailState;
		const turnAngle = ship.turnAngle;
		const { turnSpeed, thrust } = ship.physics;
		const speed = ship.body.speed;
		const maxSpeed = 5;
		const speedRatio = Math.min(speed / maxSpeed, 1);
		const turnScale = 1 - speedRatio * 0.6; // linear

		// Turning
		Body.setAngularVelocity(body, turnSpeed * turnAngle * turnScale);

		const force = {
			x: Math.cos(body.angle) * thrust * sailState,
			y: Math.sin(body.angle) * thrust * sailState,
		};

		Body.applyForce(body, body.position, force);
	}

	updateCannon(cannon: Cannon, dt: number) {
		if (cannon.reloadTimer > 0) {
			cannon.reloadTimer = Math.max(0, cannon.reloadTimer - dt * 1000);
			cannon.markDirty();
		}

		if (!cannon.user) return;

		const ship = cannon.parent as Ship | null;

		let localTarget = ship ? cannon.targetAngle - ship.r : cannon.targetAngle;
		while (localTarget > Math.PI) localTarget -= 2 * Math.PI;
		while (localTarget < -Math.PI) localTarget += 2 * Math.PI;

		const facingAngle = cannon.y < 0 ? -Math.PI / 2 : Math.PI / 2;
		const clampedTarget = Math.max(
			facingAngle - CANNON_ARC,
			Math.min(facingAngle + CANNON_ARC, localTarget)
		);

		let diff = clampedTarget - cannon.r;
		while (diff > Math.PI) diff -= 2 * Math.PI;
		while (diff < -Math.PI) diff += 2 * Math.PI;

		const maxStep = MAX_CANNON_SPEED * dt;
		cannon.r += Math.max(-maxStep, Math.min(maxStep, diff));
	}

	updateNPC(npc: NPC, dt: number) {
		// If there is a target, continually move towards it
		if (!npc.target) return; // <-- Remove when npcs can move independently

		// Get angle to target
		const target = npc.target;
		const angle = Math.atan2(npc.y - target.y, npc.x - target.x);

		const dx = npc.speed * Math.cos(angle);
		const dy = npc.speed * Math.sin(angle);

		// Move towards target
		npc.x -= dx;
		npc.y -= dy;
	}
}
