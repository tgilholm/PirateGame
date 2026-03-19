import EntityRegistry from '../engine/entity-registry';
import Ship, { SailState } from '../entities/ship';
import { MoveData } from '@shared/socket-protocol';

/**
 * Handles ship events
 */
export default class ShipController {
	constructor(entityRegistry: EntityRegistry) {}

	/**
	 * Provides movement inputs to the specified ship. Note that this method will only
	 * be invoked if there is a player controlling the ship, as the WorldController routes
	 * movement inputs to a ship if they are currently controlling one.
	 * @param ship the ship to provide movement inputs to
	 * @param data the movement data to provide to the ship
	 */
	handleMove(ship: Ship, data: MoveData): void {
		// Increase sail
		if (data.up) {
			switch (ship.sailState) {
				case SailState.HALF_SAIL:
					ship.sailState = SailState.FULL_SAIL;
					break;
				case SailState.NO_SAIL:
					ship.sailState = SailState.HALF_SAIL;
				default:
					// Do nothing
					break;
			}
			// Reduce sail
		} else if (data.down) {
			switch (ship.sailState) {
				case SailState.FULL_SAIL:
					ship.sailState = SailState.HALF_SAIL;
					break;
				case SailState.HALF_SAIL:
					ship.sailState = SailState.NO_SAIL;
				default:
					// Do nothing
					break;
			}
		}

		// Steer ship
		if (data.left) {
			ship.turnAngle = ship.turnAngle - 0.1;
		}

		if (data.right) {
			ship.turnAngle = ship.turnAngle + 0.1;
		}
	}
}
