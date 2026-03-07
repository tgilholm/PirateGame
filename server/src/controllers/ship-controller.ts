import EntityRegistry from "../engine/entity-registry";
import Ship from "../entities/ship";
import { MoveData } from "@shared/socket-protocol";

/**
 * Handles ship events
 */
export default class ShipController {
    constructor(entityRegistry: EntityRegistry) {
    }

    /**
     * Provides movement inputs to the specified ship. Note that this method will only
     * be invoked if there is a player controlling the ship, as the WorldController routes
     * movement inputs to a ship if they are currently controlling one.
     * @param ship the ship to provide movement inputs to
     * @param data the movement data to provide to the ship
     */
    handleMove(ship: Ship, data: MoveData): void {
        ship.inputs.up = data.up;
        ship.inputs.down = data.down;
        ship.inputs.left = data.left;
        ship.inputs.right = data.right;
    }
}