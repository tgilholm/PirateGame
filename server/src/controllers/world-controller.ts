import EntityRegistry from "../engine/entity-registry";
import PlayerController from "./player-controller";
import ShipController from "./ship-controller";
import { ActionType, PlayerAction } from "@shared/socket-protocol";
import Player from "../entities/player";
import Ship from "../entities/ship";
import MessageController from "./message-controller";
import CannonController from "./cannon-controller";

/**
 * Defines the controllers that must be passed to this one
 */
export interface GameControllers {
    playerController: PlayerController,
    shipController: ShipController,
    messageController: MessageController,
    cannonController: CannonController
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

    /**
     * Constructs a WorldController with the provided sub-controllers
     * @param entityRegistry to reference the entities in the game
     * @param controllers the controllers injected into this one
     */
    constructor(private entityRegistry: EntityRegistry, controllers: GameControllers
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
        const player = this.entityRegistry.get<Player>(playerId);
        if (!player) return;

        // Sends to the respective controller
        switch (action.type) {
            case ActionType.MOVE:

                // If the player is controlling a cannon, send move inputs to the cannon
                if (player.cannon) {
                    this.cannonController.handleMove(player.cannon, action.data);

                    // If player is at the helm, move the ship
                } else if (player.parent && player.isSteering) {
                    const ship = player.parent as Ship;

                    this.shipController.handleMove(ship, action.data);  

                } else {
                    // Otherwise move the player
                    this.playerController.handleMove(player, action.data);
                }
                break;

            case ActionType.UPGRADE:
                this.playerController.handleUpgrade(player, action.data);
                break;

                // Checks if the player is controlling a cannon.
            case ActionType.FIRE:
                // Again check if controlling a cannon- but not necessarily on a ship- land cannons?
                if (player.cannon) {
                    this.cannonController.handleFire(player.cannon);
                } else {
                    // If not controlling a cannon, fire the player's personal gun
                    this.playerController.handleGunFire(player);
                }
                break;


            case ActionType.DIG:
                this.playerController.handleDig(player, action.data);
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