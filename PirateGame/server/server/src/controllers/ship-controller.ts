import EntityRegistry from "../engine/entity-registry";
import { BaseController } from "./base-controller";

export default class ShipController extends BaseController {
    constructor(entityRegistry: EntityRegistry) {
        super(entityRegistry);
    }

    handle(playerId: string, action: string, payload: any): void {
        throw new Error("Method not implemented.");
    }
}