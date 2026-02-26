import EntityRegistry from "../engine/entity-registry";
import Ship from "../entities/ship";
import { MoveData } from "../shared/socket-protocol";

export default class ShipController {
    constructor(entityRegistry: EntityRegistry) {
    }

    handleMove(ship: Ship, data: MoveData): void {
        ship.inputs.up = data.up;
        ship.inputs.down = data.down;
        ship.inputs.left = data.left;
        ship.inputs.right = data.right;
    }
}