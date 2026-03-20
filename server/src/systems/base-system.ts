/**
 * Base class for all systems managed by the game engine. Has only one method-
 * update(dt). This method must contain only the logic that needs to happen
 * at the tick rate, such as moving players 20 times a second.
 */
export interface BaseSystem {
	/**
	 * Updates this system
	 * @param dt the difference in time from the last update
	 */
	update(dt: number): void;
}
