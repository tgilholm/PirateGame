import EntityRegistry from '../engine/entity-registry';
import PlayerController from './player-controller';
import ShipController from './ship-controller';
import { ActionType, PlayerAction } from '@shared/socket-protocol';
import Player from '../entities/player';
import Ship from '../entities/ship';
import MessageController from './message-controller';
import CannonController from './cannon-controller';
import SessionHandler from 'src/handlers/session-handler';

/**
 * Defines the controllers that must be passed to this one
 */
export interface GameControllers {
	playerController: PlayerController;
	shipController: ShipController;
	messageController: MessageController;
	cannonController: CannonController;
}

/**
 * Acts as an abstraction over the more specific controllers for each domain. Routes
 * events to their target location based on where the event originated.
 */
export default class WorldController {
	shipController: ShipController;
	playerController: PlayerController;
	messageController: MessageController;
	cannonController: CannonController;

	timestamps: Map<string, number> = new Map();

	/**
	 * Constructs a WorldController with the provided sub-controllers
	 * @param entityRegistry to reference the entities in the game
	 * @param controllers the controllers injected into this one
	 */
	constructor(
		private entityRegistry: EntityRegistry,
		private sessionHandler: SessionHandler,
		controllers: GameControllers
	) {
		this.shipController = controllers.shipController;
		this.playerController = controllers.playerController;
		this.messageController = controllers.messageController;
		this.cannonController = controllers.cannonController;
	}

	/**
	 * Handles incoming events from the player
	 * @param playerId the id of the player that the event came from
	 * @param action the action, matching the schema PlayerAction, sent by the user
	 */
	public handle(playerId: string, action: PlayerAction) {
		// keep track of the time the player last sent an action
		const lastActionTime = this.timestamps.get(playerId) || Date.now(); // if not seen before

		const player = this.entityRegistry.get<Player>(playerId);
		if (!player) return;

		if (action.type === ActionType.QUIT) {
			this.sessionHandler.removePlayer(playerId);
			return; // don't process any further actions
		}

		// Check for respawn before checking for death- otherwise this block is never invoked
		if (player.respawnStarted && player.respawnTimer <= 0) {
			this.playerController.handleRespawn(player);
		}

		// Handle respawn/quit event first
		if (action.type === ActionType.RESPAWN_SHIP) {
			this.playerController.handleRespawnShip(player);
		}

		// check for ship death before player death
		if (player.ship.isDead) {
			return;
		}

		if (player.isDead) {
			this.playerController.handleDeath(player);
			return; // don't handle actions if dead, just respawn
		}

		const ship = player.parent as Ship;
		switch (action.type) {
			// Send move inputs based on player context
			case ActionType.MOVE:
				this.timestamps.set(playerId, Date.now()); // overwrite

				if (player.cannon) {
					this.cannonController.handleMove(player.cannon, action.data);

					// If player is at the helm, move the ship
				} else if (player.parent && player.isSteering) {
					this.shipController.handleMove(ship, action.data);
				} else {
					// Otherwise move the player
					this.playerController.handleMove(player, action.data);
				}
				break;

			case ActionType.UPGRADE:
				this.playerController.handleUpgrade(player, action.data);
				break;

			case ActionType.FIRE:
				if (player.isDigging) {
					this.playerController.handleDig(player);
				} else if (player.cannon) {
					this.cannonController.handleFire(player.cannon, lastActionTime);
				} else if (player.isSteering) {
					this.shipController.handleFire(ship);
				} else {
					// If not controlling a cannon, fire the player's personal gun
					this.playerController.handleGunFire(player, lastActionTime);
				}
				break;
			case ActionType.INTERACT:
				this.playerController.handleInteract(player, action.data);
				break;
			case ActionType.RELEASE:
				this.playerController.handleRelease(player);
				break;
			case ActionType.MESSAGE:
				this.messageController.handleMessage(player, action.data);
				break;
		}
	}
}
