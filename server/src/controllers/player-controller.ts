import EntityRegistry from "../engine/entity-registry";
import Player from "../entities/player";
import UpgradeHandler from "../handlers/upgrade-handler";
import { InteractData, MoveData, UpgradeData } from "@shared/socket-protocol";

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

    handleInteract(player: Player, data: InteractData): void {
        // Get interactables near player
        // "select" nearest one
        // If close enough, use that item


        throw new Error("Method not implemented.");
    }

    handleRelease(player: Player): void {
        // Already interacting with an object?
        // Get that object, and let go of it
        throw new Error("Method not implemented.");
    }

    handleDig(player: Player) {
        throw new Error("Method not implemented.");
    }
    handleGunFire(player: Player) {
        throw new Error("Method not implemented.");
    }
    handleCannonFire(player: Player) {
        throw new Error("Method not implemented.");
    }
    handleUpgrade(player: Player, data: UpgradeData) {
        throw new Error("Method not implemented.");
    }

}