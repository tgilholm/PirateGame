import EntityRegistry from "../engine/entity-registry";
import PlayerController from "./player-controller";
import ShipController from "./ship-controller";
import { ActionType, PlayerAction } from "../../../shared/socket-protocol";
import Player from "../entities/player";
import Ship from "../entities/ship";
import MessageController from "./message-controller";

export interface GameControllers {
    playerController: PlayerController,
    shipController: ShipController,
    messageController: MessageController
}

export default class WorldController {

    shipController: ShipController;
    playerController: PlayerController;
    messageController: MessageController;

    constructor(private entityRegistry: EntityRegistry, controllers: GameControllers
    ) {
        this.shipController = controllers.shipController;
        this.playerController = controllers.playerController;
        this.messageController = controllers.messageController;
    }

    public handle(playerId: string, action: PlayerAction) {
        const player = this.entityRegistry.get<Player>(playerId);
        if (!player) return;

        switch (action.type) {
            case ActionType.MOVE:

                // If player is controlling a ship, send move inputs to the ship
                if (player.parent && player.isSteering) {
                    const ship = player.parent as Ship;

                    if (parent) {
                        this.shipController.handleMove(ship, action.data);  // Send the move inputs to the ship
                    }
                } else {
                    // Send directly to the player controller
                    this.playerController.handleMove(player, action.data);
                }
                break;
            case ActionType.UPGRADE:
                this.playerController.handleUpgrade(player, action.data);
                break;

            case ActionType.FIRE:
                // Again check if controlling a cannon- but not necessarily on a ship- land cannons?
                if (player.isUsingCannon) {
                    this.playerController.handleCannonFire(player);
                } else {
                    // If not controlling a cannon, fire the player's personal gun
                    this.playerController.handleGunFire(player);
                }
                break;

            case ActionType.DIG:
                this.playerController.handleDig(player);
                break;
            case ActionType.INTERACT:
                this.playerController.handleInteract(player);
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