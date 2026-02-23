import { BaseController } from "./base-controller";
import EntityRegistry from "../engine/entity-registry";
import PlayerController from "./player-controller";
import ShipController from "./ship-controller";

export interface GameControllers {
    playerController: PlayerController,
    shipController: ShipController
}

export default class WorldController {
    private controllers: Map<string, BaseController> = new Map();

    constructor(private entityRegistry: EntityRegistry, controllers: GameControllers
    ) {
        this.controllers.set('player', controllers.playerController);
        this.controllers.set('ship', controllers.shipController);
    }

}