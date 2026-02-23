import EntityRegistry from "../engine/entity-registry";

export abstract class BaseController {
    constructor(protected entityRegistry: EntityRegistry) { }
    abstract handle(playerId: string, action: string, payload: any): void;
}