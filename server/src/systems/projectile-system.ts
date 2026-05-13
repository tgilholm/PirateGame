import Projectile from '../entities/projectiles/projectile';
import EntityRegistry from '../engine/entity-registry';
import { BaseSystem } from './base-system';
import SpatialGrid from '../application/spatial-grid';
import Player from '../entities/player';
import Ship from '../entities/ship';
import Entity from '../entities/entity';
import Shop from '../entities/shop';
import { SplashEvent, SplashType } from '@shared/socket-protocol';
import TerrainMap from '../engine/terrain-map';

/**
 * Updates all projectile objects each tick. Handles collisions between
 * projectiles and other objects, destroying the projectile and dealing
 * damage to the struck object
 */
export default class ProjectileSystem implements BaseSystem {
	public pendingSplashes: SplashEvent[] = [];

	constructor(
		private entityRegistry: EntityRegistry,
		private grid: SpatialGrid,
		private terrain: TerrainMap
	) {}

	/**
	 * Updates all the projectiles in the game
	 * @param dt the difference in time from the last update
	 */
	update(dt: number): void {
		const projectiles = this.entityRegistry.getByType<Projectile>('projectile');

		projectiles.forEach((projectile) => {
			const nearby = this.grid.getNearby(projectile.x, projectile.y);

			this.moveProjectile(projectile, dt);
			if (projectile.ttl <= 0) return;
			this.collidePlayerAndNPC(projectile, nearby);
			if (projectile.ttl <= 0) return;
			this.collideShip(projectile, nearby);
			if (projectile.ttl <= 0) return;
			this.collideShop(projectile, nearby);
			if (projectile.ttl <= 0) return;
			this.collideWalls(projectile);
		});
	}

	moveProjectile(proj: Projectile, dt: number) {
		proj.x += proj.vx * dt;
		proj.y += proj.vy * dt;
		proj.ttl -= dt * 1000;

		// Delete expired projectiles
		if (proj.ttl <= 0) {
			const onLand = this.terrain.isOnIsland(proj.x, proj.y);
			const splashType: SplashType =
				proj.type === 'cannonball'
					? onLand
						? 'cannon-land'
						: 'cannon-water'
					: onLand
						? 'bullet-land'
						: 'bullet-water';
			this.pendingSplashes.push({ x: proj.x, y: proj.y, splashType });
			this.destroyEntity(proj);
		}
	}

	collidePlayerAndNPC(proj: Projectile, nearby: Set<string>) {
		for (const id of nearby) {
			const entity = this.entityRegistry.get(id);
			if (!entity || proj.firedBy === entity) continue;
			if (!(entity.type === 'player' || entity.type === 'npc')) continue;
			if (entity.type === 'player' && (entity as Player).cannon) continue;
			if (entity.type === 'player' && (entity as Player).isSteering) continue;

			const worldPos = entity.parent
				? (entity.parent as Ship).localToWorld(entity.x, entity.y)
				: { x: entity.x, y: entity.y };

			const dist = Math.hypot(proj.x - worldPos.x, proj.y - worldPos.y);
			if (dist < proj.radius + 25) {
				// 15 = player radius
				entity.health -= proj.damage;
				entity.markDirty();

				const splashType: SplashType = proj.type === 'cannonball' ? 'cannon-blood' : 'bullet-blood';
				this.pendingSplashes.push({ x: proj.x, y: proj.y, splashType });
				proj.ttl = -1;
				this.destroyEntity(proj);
				break;
			}
		}
	}

	collideShip(proj: Projectile, nearby: Set<string>) {
		if (proj.type !== 'cannonball') return; // bullets don't damage ships

		for (const id of nearby) {
			const ship = this.entityRegistry.get(id);
			if (!(ship instanceof Ship) || proj.firedBy?.parent === ship) continue;

			const local = ship.worldToLocal(proj.x, proj.y);
			if (ship.isInside(local.x, local.y, -proj.radius)) {
				ship.health -= proj.damage;
				ship.markDirty();
				this.pendingSplashes.push({ x: proj.x, y: proj.y, splashType: 'cannon-water' });
				proj.ttl = -1;
				this.destroyEntity(proj);
				break;
			}
		}
	}

	collideShop(proj: Projectile, nearby: Set<string>) {
		// replace with interactable collide
		nearby.forEach((id) => {
			const entity = this.entityRegistry.get(id);
			if (entity?.type !== 'shop') return;
			const shop = entity as Shop;
			const dist = Math.hypot(proj.x - shop.x, proj.y - shop.y);
			if (dist < proj.radius + shop.radius) {
				this.destroyEntity(proj);
			}
		});
	}

	collideWalls(proj: Projectile): void {
		const tileSize = this.terrain.tileWidth;

		// Define the bounding box of the player in world space
		const left = proj.x - proj.radius;
		const right = proj.x + proj.radius;
		const top = proj.y - proj.radius;
		const bottom = proj.y + proj.radius;

		// Convert bounding box to tile coordinates
		const startX = Math.floor(left / tileSize);
		const endX = Math.floor(right / tileSize);
		const startY = Math.floor(top / tileSize);
		const endY = Math.floor(bottom / tileSize);

		// Only check tiles within the player's immediate area
		for (let tx = startX; tx <= endX; tx++) {
			for (let ty = startY; ty <= endY; ty++) {
				if (this.terrain.isWall(tx, ty)) this.destroyEntity(proj);
			}
		}
	}

	/**
	 * Removes a projectile
	 * @param id the id to delete
	 */
	public destroyEntity(entity: Entity) {
		this.entityRegistry.delete(entity.id);
		this.grid.remove(entity.id);
	}
}
