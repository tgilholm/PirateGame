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

export default class SwordSystem implements BaseSystem {
	constructor(
		private registry: EntityRegistry,
		private grid: SpatialGrid,
		private factory: EntityFactory
	) {}

	update(dt: number): void {
		const players = this.registry.getByType<Player>('player');
		players.forEach((player) => this.updateSwing(player, dt));

		// Handle barrel respawns
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
		const nearby = this.grid.getNearby(playerWorldPos.x, playerWorldPos.y);

		nearby.forEach((id) => {
			if (id === player.id) return;
			const entity = this.registry.get(id);
			if (!entity) return;

			const entityPos = entity.worldPos;
			const dx = entityPos.x - playerWorldPos.x;
			const dy = entityPos.y - playerWorldPos.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist > Sword.RANGE) return;

			// Check if within the swing arc centered on aimAngle
			const angleToEntity = Math.atan2(dy, dx);
			let angleDiff = angleToEntity - player.aimAngle;
			while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
			while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

			if (Math.abs(angleDiff) > Sword.ARC / 2) return;

			// Apply effects based on entity type
			if (entity.type === 'player' || entity.type === 'npc') {
				this.hitLivingEntity(entity as Player | NPC, player, dx, dy, dist);
			} else if (entity.type === 'palm-tree') {
				this.hitPalmTree(entity as PalmTree);
			} else if (entity.type === 'barrel') {
				this.hitBarrel(entity as Barrel, playerWorldPos);
			}
		});
	}

	private hitLivingEntity(entity: Player | NPC, attacker: Player, dx: number, dy: number, dist: number): void {
		entity.health -= Sword.DAMAGE;

		// Knockback — push away from attacker
		const knockbackX = (dx / dist) * Sword.KNOCKBACK;
		const knockbackY = (dy / dist) * Sword.KNOCKBACK;

		// Apply knockback as a velocity burst - movement system will decay it
		entity.vx += knockbackX * 0.016; // roughly one frame worth
		entity.vy += knockbackY * 0.016;

		// For players on ships we apply the knockback in local space
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
		tree.hitCount++;
		if (tree.hitCount >= tree.treeHealth && tree.coconuts > 0) {
			tree.hitCount = 0;
			tree.coconuts--;
			tree.markDirty();

			// Spawn coconut near tree with slight random offset
			const offsetX = (Math.random() - 0.5) * 60;
			const offsetY = (Math.random() - 0.5) * 60;
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

			// Spawn bandage near barrel
			const offsetX = (Math.random() - 0.5) * 40;
			const offsetY = (Math.random() - 0.5) * 40;
			this.factory.createBandage(`bandage_${barrel.id}_${Date.now()}`, barrel.x + offsetX, barrel.y + offsetY);
		} else {
			barrel.markDirty();
		}
	}
}
