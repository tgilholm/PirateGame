import EntityRegistry from "../engine/entity-registry";
import Player from "../entities/player";
import UpgradeHandler from "../handlers/upgrade-handler";
import { MoveData } from "../shared/socket-protocol";

export default class PlayerController {
    constructor(entityRegistry: EntityRegistry,
        upgradeHandler: UpgradeHandler
    ) {
    }


    handleMove(player: Player, data: MoveData): void {
        player.inputs.up = data.up;
        player.inputs.down = data.down;
        player.inputs.left = data.left;
        player.inputs.right = data.right;
    }

}