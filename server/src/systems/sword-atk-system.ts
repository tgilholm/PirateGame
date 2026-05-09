import EntityRegistry from '../engine/entity-registry';
import Player from '../entities/player';
import NPC from '../entities/npcs/npc';
import Ship from '../entities/ship';
import PalmTree from '../entities/interactables/palm-tree';
import Barrel from '../entities/interactables/barrel';
import { BaseSystem } from './base-system';
import SpatialGrid from '../application/spatial-grid';
import Sword from '../entities/sword';
import EntityFactory from '../entities/entity-factory';
import { lineIntersectsRotatedRect } from '../utils/liang-barsky';

export default class SwordSystem implements BaseSystem {
	public onSwingResult?: (attackerId: string, hitEnemy: boolean) => void;

	constructor(
		private registry: EntityRegistry,
		private grid: SpatialGrid,
		private factory: EntityFactory
	) {}

	update(dt: number): void {
		const players = this.registry.getByType<Player>('player');
		players.forEach((player) => this.updateSwing(player, dt));

		// barrel respawns
		const barrels = this.registry.getByType<Barrel>('barrel');
		barrels.forEach((barrel) => this.updateBarrel(barrel, dt));
	}

	private updateSwing(player: Player, dt: number): void {
		if (player.swingTimer > 0) {
			player.swingTimer = Math.max(0, player.swingTimer - dt * 1000);
			if (player.swingTimer <= 0) {
				player.isSwinging = false;
			}
			player.markDirty();
		}

		if (player.swingCooldown > 0) {
			player.swingCooldown = Math.max(0, player.swingCooldown - dt * 1000);
			player.markDirty();
		}
	}

	private updateBarrel(barrel: Barrel, dt: number): void {
		if (!barrel.hasItem && barrel.respawnTimer > 0) {
			barrel.respawnTimer = Math.max(0, barrel.respawnTimer - dt * 1000);
			if (barrel.respawnTimer <= 0) {
				barrel.hasItem = true;
				barrel.health = Barrel.HIT_HEALTH;
				barrel.markDirty();
			}
		}
	}

	public handleSwing(player: Player): void {
		if (!player.canSwing || player.isDead) return;

		player.isSwinging = true;
		player.swingTimer = Sword.SWING_TIME;
		player.swingCooldown = Sword.COOLDOWN;
		player.markDirty();

		const playerWorldPos = player.worldPos;
		const swingTip = {
			x: playerWorldPos.x + Math.cos(player.aimAngle) * Sword.RANGE,
			y: playerWorldPos.y + Math.sin(player.aimAngle) * Sword.RANGE,
		};

		const nearby = this.grid.getNearby(playerWorldPos.x, playerWorldPos.y);
		let hitEnemy = false;

		nearby.forEach((id) => {
			if (id === player.id) return;
			const entity = this.registry.get(id);
			if (!entity) return;

			const entityPos = entity.worldPos;
			const dx = entityPos.x - playerWorldPos.x;
			const dy = entityPos.y - playerWorldPos.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			/*
			Massive bodge. Not all entities have a width and height defined yet,
			so just use centre-of-entity checking if not found, otherwise use
			the bounding box algorithm
			*/
			if (entity.width !== 0 && entity.height !== 0) {
				const hw = entity.width / 2;
				const hh = entity.height / 2;

				const hit = lineIntersectsRotatedRect(playerWorldPos, swingTip, {
					minX: entityPos.x - hw,
					minY: entityPos.y - hh,
					maxX: entityPos.x + hw,
					maxY: entityPos.y + hh,
					angle: entity.r ?? 0,
				});

				if (!hit) return;
			} else {
				// centre check
				if (dist > Sword.RANGE) return;

				// Check if within the swing arc centered on  aimAngle
				const angleToEntity = Math.atan2(dy, dx);
				let angleDiff = angleToEntity - player.aimAngle;
				while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
				while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

				if (dist < 1) return; //
				if (Math.abs(angleDiff) > Sword.ARC / 2) return;
			}

			// called regardless of the method used above
			if (entity.type === 'player' || entity.type === 'npc') {
				this.hitLivingEntity(entity as Player | NPC, player, dx, dy, dist);
				hitEnemy = true;
			} else if (entity.type === 'palm-tree') {
				this.hitPalmTree(entity as PalmTree);
			} else if (entity.type === 'barrel') {
				this.hitBarrel(entity as Barrel, playerWorldPos);
			}
		});

		this.onSwingResult?.(player.id, hitEnemy);
	}

	private hitLivingEntity(entity: Player | NPC, attacker: Player, dx: number, dy: number, dist: number): void {
		entity.health -= Sword.DAMAGE;

		const knockbackX = (dx / dist) * Sword.KNOCKBACK;
		const knockbackY = (dy / dist) * Sword.KNOCKBACK;

		// knockback velocity
		entity.vx += knockbackX * 0.016; // roughly one frame worth
		entity.vy += knockbackY * 0.016;

		//knockback on ship
		if (entity.type === 'player') {
			const p = entity as Player;
			if (p.parent instanceof Ship) {
				const ship = p.parent as Ship;
				const cos = Math.cos(-ship.r);
				const sin = Math.sin(-ship.r);
				p.x += (knockbackX * cos - knockbackY * sin) * 0.05;
				p.y += (knockbackX * sin + knockbackY * cos) * 0.05;
			} else {
				p.x += knockbackX * 0.05;
				p.y += knockbackY * 0.05;
			}
		} else {
			entity.x += knockbackX * 0.05;
			entity.y += knockbackY * 0.05;
		}

		entity.markDirty();
	}

	private hitPalmTree(tree: PalmTree): void {
		if (tree.coconuts <= 0) return;

		tree.hitCount++;
		tree.markDirty();

		if (tree.hitCount >= tree.treeHealth) {
			tree.hitCount = 0;
			tree.coconuts--;
			tree.markDirty();

			// Spawn near the base of the trunk, not the center
			const offsetX = (Math.random() - 0.5) * 30;
			const offsetY = 32 + Math.random() * 15; // push down toward base
			this.factory.createCoconut(`coconut_${tree.id}_${Date.now()}`, tree.x + offsetX, tree.y + offsetY, tree.id);
		}
	}

	private hitBarrel(barrel: Barrel, attackerPos: { x: number; y: number }): void {
		if (!barrel.hasItem) return;

		barrel.health--;
		if (barrel.health <= 0) {
			barrel.hasItem = false;
			barrel.health = 0;
			barrel.respawnTimer = Barrel.RESPAWN_TIME;
			barrel.markDirty();

			// spawn bandage near barrel
			const offsetX = (Math.random() - 0.5) * 40;
			const offsetY = (Math.random() - 0.5) * 40;
			this.factory.createBandage(`bandage_${barrel.id}_${Date.now()}`, barrel.x + offsetX, barrel.y + offsetY);
		} else {
			barrel.markDirty();
		}
	}
}
