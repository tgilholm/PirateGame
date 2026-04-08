import Ship from '../entities/ship';
import EntityRegistry from '../engine/entity-registry';
import Player from '../entities/player';
import { InteractData, MoveData, UpgradeData } from '@shared/socket-protocol';
import Interactable from '../entities/interactables/interactable';
import InteractionHandler from '../handlers/interaction-handler';
import Entity from '../entities/entity';
import Cannon from '../entities/interactables/cannon';
import Helm from '../entities/interactables/helm';
import Ladder from '../entities/interactables/ladder';
import Bullet from '../entities/projectiles/bullet';
import TreasureSystem from '../systems/treasure-system';
import SpawnSystem from '../systems/spawn-system';
import Matter from 'matter-js';
import Treasure from '../entities/interactables/treasure';
import UpgradeHandler from '../handlers/upgrade-handler';
import Shop from '../entities/shop';
import EntityFactory from 'src/entities/entity-factory';
import Money from 'src/entities/interactables/money';

/**
 * Handles events affecting the player
 */
export default class PlayerController {
	/**
	 */
	constructor(
		private entityRegistry: EntityRegistry,
		private factory: EntityFactory,
		private interactionHandler: InteractionHandler,
		private upgradeHandler: UpgradeHandler,
		private treasureSystem: TreasureSystem,
		private spawnSystem: SpawnSystem
	) {}

	/**
	 * Handles the movement of this player- this method should only be invoked
	 * if the player is not controlling a ship or cannon
	 * @param player the player for which to update the inputs
	 * @param data the inputs matching MoveData
	 */
	handleMove(player: Player, data: MoveData): void {
		player.inputs.up = data.up;
		player.inputs.down = data.down;
		player.inputs.left = data.left;
		player.inputs.right = data.right;
		player.aimAngle = data.aimAngle;
	}

	/**
	 * Handles the interaction of this player with an interactable object. Checks if the object
	 * is close enough to the player, and if they are, delegates to the interaction handler
	 * @param player the player interacting with an object
	 * @param data the data matching InteractData, containing the id of the target interactable
	 */
	handleInteract(player: Player, data: InteractData): void {
		const interactable = this.entityRegistry.get<Interactable>(data.targetId);

		if (!interactable) return; // couldn't find interactable

		const interactableWorldPos = this.getWorldPosition(interactable);
		const playerWorldPos = this.getWorldPosition(player);

		if (!interactableWorldPos || !playerWorldPos) {
			return;
		}

		// Distance between player and interactable
		const dist = Math.sqrt(
			Math.pow(playerWorldPos.x - interactableWorldPos?.x, 2) +
				Math.pow(playerWorldPos.y - interactableWorldPos?.y, 2)
		);

		if (dist < 50) {
			const ship = interactable.parent as Ship;

			switch (interactable.type) {
				case 'helm':
					this.interactionHandler.handleHelmInteraction(player, ship, interactable as Helm);
					break;

				case 'cannon':
					this.interactionHandler.handleCannonInteraction(player, interactable as Cannon);
					break;
				case 'ladder':
					this.interactionHandler.handleLadderInteraction(player, ship, interactable as Ladder);
					break;

				case 'treasure':
					this.interactionHandler.handleTreasureInteraction(player, interactable as Treasure);
					break;

				case 'money':
					this.interactionHandler.handleMoneyInteraction(player, interactable as Money);
					break;
				default:
					return;
			}
		}
	}

	handleRespawnShip(player: Player): void {
		// Respawn ship & player at a new location
		// TODO: Ensure player is a set distance from their death point

		const ship = player.ship;
		const { x, y } = this.spawnSystem.getSpawnPoint();

		ship.body.position.x = x;
		ship.body.position.y = y;
		ship.x = x;
		ship.y = y;
		ship.health = ship.maxHealth;

		// velocity has to be set like this
		// ship.vx is mirrored directly from the physics body
		const vec = Matter.Vector.create(0, 0);
		Matter.Body.setVelocity(ship.body, vec);

		// tell client to skip extrapolation
		ship.pendingTeleport = true;
		player.pendingTeleport = true;
		ship.sunkNotified = false;

		// Existing method already puts player at 0,0 on their ship
		this.handleRespawn(player);
		ship.markDirty();
	}

	handleDeath(player: Player): void {
		if (player.respawnStarted) return;

		player.respawnStarted = true;
		player.respawnTimer = player.respawnTime;

		player.inputs = {
			up: false,
			down: false,
			left: false,
			right: false,
		};

		// Spawn money stack at the death point
		const money = this.factory.createInteractable(
			player.parent as Ship | null,
			{ type: 'money', x: player.x, y: player.y },
			player.id
		) as Money;

		money.value = player.gold;
		player.gold = 0;

		player.markDirty();
	}

	handleRespawn(player: Player): void {
		player.respawnStarted = false;

		player.deathNotified = false;

		const ship = player.ship;
		player.parent = ship;
		player.x = 0;
		player.y = 0;
		player.health = player.maxHealth;

		player.inputs = {
			up: false,
			down: false,
			left: false,
			right: false,
		};

		player.markDirty();
	}

	/**
	 * Handles players releasing an interactable that they are using.
	 * @param player the player to handle the release event for
	 */
	handleRelease(player: Player): void {
		// Get all interactables
		const interactables = this.entityRegistry.getByType<Interactable>('interactable');
		let interactable = null;

		// Find that interactable
		for (let i = 0; i < interactables.length; i++) {
			if (interactables[i].user === player) {
				interactable = interactables[i];
			}
		}

		// Find the parent if the interactable has one
		const ship = (interactable?.parent as Ship) || null;

		this.interactionHandler.handleRelease(player, ship, interactable);
	}

	handleDig(player: Player) {
		this.treasureSystem.hit(player);
	}

	handleGunFire(player: Player, lastActionTime: number) {
		// Wait until reloaded
		if (!player || player.carrying || !player.isReloaded || player.isSteering) return;
		player.reloadTimer = player.reloadTime;

		// Calculate time between this event and the last packet
		const now = Date.now();
		const latency = (now - lastActionTime) / 1000;

		const worldPos = this.getWorldPosition(player);

		// Spawn the bullet at the client's next visual position, not their interp target
		let spawnX = worldPos.x - player.vx * latency;
		let spawnY = worldPos.y - player.vy * latency;

		const bullet = new Bullet(`bullet_${Date.now()}_${player.id}`, spawnX, spawnY, player.aimAngle);

		// Apply parent velocity only if on ship
		if (player.parent && player.parent instanceof Ship) {
			bullet.vx += player.parent.vx;
			bullet.vy += player.parent.vy;
		}

		// catch up to where the bullet should originally have been fired
		bullet.x += bullet.vx * latency;
		bullet.y += bullet.vy * latency;

		bullet.firedBy = player;
		this.entityRegistry.create(bullet);
	}

	handleUpgrade(player: Player, data: UpgradeData) {
		const playerWorldPos = this.getWorldPosition(player);

		const shops = this.entityRegistry.getByType<Shop>('shop');
		const isNearShop = shops.some((shop) => {
			// stops after finding one shop in range
			const distSq = Math.pow(playerWorldPos.x - shop.x, 2) + Math.pow(playerWorldPos.y - shop.y, 2);
			return distSq < Math.pow(200, 2);
		});

		if (isNearShop) {
			this.upgradeHandler.handleUpgrade(player.ship, data.name, player);
		}
	}

	/**
	 * Helper method to get the absolute coordinates of an entity if they are on a ship.
	 * @param entity the entity for which to find the absolute coordinates
	 * @returns
	 */
	private getWorldPosition(entity: Entity) {
		if (!entity.parent) {
			// If the entity has no parent, its coordinates are already in world space
			return { x: entity.x, y: entity.y };
		}

		const parent = this.entityRegistry.get<Ship>(entity.parent.id);

		// If the parent is a ship, use its localToWorld method
		if (parent) {
			const ship = parent as Ship;
			return ship.localToWorld(entity.x, entity.y);
		}

		// If the parent is not a ship, return the entity's local position
		return { x: entity.x, y: entity.y };
	}
}
