import Treasure from '../entities/interactables/treasure';
import Cannon from '../entities/interactables/cannon';
import Helm from '../entities/interactables/helm';
import Interactable from '../entities/interactables/interactable';
import Ladder from '../entities/interactables/ladder';
import Player from '../entities/player';
import Ship from '../entities/ship';
import TreasureSystem from '../systems/treasure-system';
import { TreasureState } from '@shared/socket-protocol';
import EntityRegistry from '../engine/entity-registry';
import Money from 'src/entities/interactables/money';
import Entity from 'src/entities/entity';

/**
 * Handler class- provides methods for each type of player interaction with interactable entities,
 * for example cannons, helms, treasure chests etc.
 */
export default class InteractionHandler {
	constructor(
		private treasureSystem: TreasureSystem,
		private registry: EntityRegistry,
		private destroyEntity: (entity: Entity) => void
	) {}

	/**
	 * Handles the interaction of a player with a helm object, and therefore take control of the ship
	 * by resetting the ship's pilot to that player. Only allows the interaction if the player is on
	 * the ship, and the ship is not already being controlled
	 * @param player the player doing the interaction
	 * @param ship the ship the interactable is on
	 * @param helm the helm being interacted with
	 */
	handleHelmInteraction(player: Player, ship: Ship, helm: Helm) {
		// Player not on ship or ship already being piloted
		if (!player.parent || ship.pilot || helm.user) return;

		helm.user = player;
		ship.pilot = player;
		player.isSteering = true;

		// Move player just behind the helm
		player.x = helm.x - 25;
		player.y = helm.y;

		player.markDirty();
		ship.markDirty();
		helm.markDirty();
	}

	/**
	 * Handles the interaction of a player with a cannon object. If successful, sets the player as the
	 * user of the cannon, and moves them slightly behind it
	 * @param player the player doing the interaction
	 * @param cannon the cannon being interacted with
	 */
	handleCannonInteraction(player: Player, cannon: Cannon) {
		if (!player.parent || cannon.user) return; // cannon must be free

		const cannonYdir = cannon.y > 0 ? -1 : 1;

		player.x = cannon.x;
		cannon.user = player;
		player.cannon = cannon;
		player.y = cannon.y + cannonYdir * 25; // move the player behind the cannon

		player.markDirty();
		cannon.markDirty();
	}

	/**
	 * Handles the interaction of a player and a ladder object. Ladders can be interacted with both
	 * on and off ships. If on a ship, the ladder takes them off it, with a slight normalised "push"
	 * outward of the ship to clear the physics boundary, and vice versa
	 * @param player the player doing the interaction
	 * @param ship the ship the ladder is on
	 * @param ladder the ladder being interacted with
	 */
	handleLadderInteraction(player: Player, ship: Ship, ladder: Ladder) {
		if (!player.parent) {
			const enterYdir = ladder.y > 0 ? -1 : 1;

			player.x = ladder.x;
			player.y = ladder.y + enterYdir * 20;

			player.parent = ship;
		} else {
			const dist = Math.sqrt(ladder.x * ladder.x + ladder.y * ladder.y);
			const dirX = ladder.x / dist;
			const dirY = ladder.y / dist;

			const exitPadding = 40;
			const shuntLocalX = ladder.x + dirX * exitPadding;
			const shuntLocalY = ladder.y + dirY * exitPadding;
			const shuntGlobal = ship.localToWorld(shuntLocalX, shuntLocalY);

			player.x = shuntGlobal.x;
			player.y = shuntGlobal.y;
			player.parent = null;
		}

		player.markDirty();
		ship.markDirty();
	}

	handleMoneyInteraction(player: Player, money: Money) {
		if (player.parent === money.parent) {
			player.gold += money.value;
			this.destroyEntity(money);
		}
	}

	/**
	 * Starts an interaction with a treasure object
	 * @param player
	 * @param treasure
	 * @returns
	 */
	handleTreasureInteraction(player: Player, treasure: Treasure) {
		const busy = player.carrying || treasure.state === TreasureState.DIGGING || treasure.user || player.isDigging;
		if (busy) return; // treasure can only be dug by one player at a time

		switch (treasure.state) {
			case TreasureState.BURIED:
				// start digging
				treasure.user = player;
				this.treasureSystem.createSession(player, treasure);
				break;
			case TreasureState.DUGUP:
				// pick up, create hole
				treasure.user = player;
				player.carrying = treasure;

				treasure.state = TreasureState.CARRIED;
				this.treasureSystem.createHole(treasure);

				break;
			case TreasureState.DROPPED:
				// pick up, no hole
				treasure.user = player;
				player.carrying = treasure;
				treasure.parent = null;
				treasure.state = TreasureState.CARRIED;
				break;
			default:
				// opening, carried, hole- do nothing
				break;
		}

		treasure.markDirty();
		player.markDirty();
	}

	/**
	 * Ends any continued interaction a player currently has with an interactable object. If the player
	 * was controlling a helm, they are removed from the ship's pilot too
	 * @param player the player releasing an interactable
	 * @param ship the ship (if any) the interactable is on
	 * @param interactable the interactable (if any) the player wants to release
	 */
	handleRelease(player: Player, ship: Ship | null, interactable: Interactable | null) {
		if (!interactable || interactable.user !== player) return; // player can only release if using

		interactable.user = null;

		switch (interactable.type) {
			case 'helm':
				if (!ship) return;
				player.isSteering = false;
				ship.pilot = null; // reset pilot
				break;

			case 'cannon':
				player.cannon = null;
				break;

			case 'treasure':
				const treasure = interactable as Treasure;
				const ships = this.registry.getByType<Ship>('ship');
				player.carrying = null;

				const angle = player.aimAngle;
				const dropWorldX = treasure.x + 20 * Math.cos(angle);
				const dropWorldY = treasure.y + 20 * Math.sin(angle);

				treasure.parent = null;
				for (const ship of ships) {
					const local = ship.worldToLocal(dropWorldX, dropWorldY);
					if (ship.isInside(local.x, local.y, 0)) {
						treasure.x = local.x;
						treasure.y = local.y;
						treasure.parent = ship;
						break;
					}
				}

				if (!treasure.parent) {
					treasure.x = dropWorldX;
					treasure.y = dropWorldY;
				}

				this.treasureSystem.deleteSession(player);
				treasure.state = TreasureState.DROPPED;
				break;
		}

		player.markDirty();
		ship?.markDirty();
		interactable.markDirty();
	}
}
