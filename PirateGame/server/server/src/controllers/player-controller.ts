import EntityRegistry from "../engine/entity-registry";
import UpgradeHandler from "../handlers/upgrade-handler";
import { BaseController } from "./base-controller";

export default class PlayerController extends BaseController {
    constructor(entityRegistry: EntityRegistry,
        upgradeHandler: UpgradeHandler
    ) {
        super(entityRegistry)
    }
    handle(playerId: string, action: string, payload: any): void {
        throw new Error("Method not implemented.");
    }

}