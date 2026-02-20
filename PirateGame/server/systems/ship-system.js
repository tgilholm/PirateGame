import EntityRegistry from "../engine/entity-registry.js";

export default class ShipSystem {
    /**
     * Routes an event by its name to the relevant method. If the event
     * cannot be found, returns safely. Note that event names for ship events
     * must be given as "ship:doSomething";
     * @param {String} playerId 
     * @param {String} eventName 
     * @param {Object} payload 
     */
    static handle(playerId, eventName, payload) {
        if (!eventName || eventName.split(":")[0] !== "ship") {
            return { result: false, reason: `Could not parse event name` };
        }

        const action = eventName.split(':')[1];     // extract the action - "doStuff"

        // Check for invalid actions
        const handlers = this.handlers[action];
        if (!handlers) return { result: false, reason: `Unknown action: ${action}` };

        // Route to the specific method with the event data
        return handlers.call(this, playerId, payload);
    }

    static handlers = {
        moveInput: ShipSystem.moveInput
        //takeDamage: ShipSystem.takeDamage     
    }

    static moveInput(playerId, payload) {

        const ship = EntityRegistry.getShip(payload.shipId);
        if (!ship) {
            return { result: false, reason: 'Ship not found' };
        }

        // Only the pilot can move
        if (ship.pilotId !== playerId) {
            return { result: false, reason: `Player ${playerId} is not the pilot, cannot control ship` };
        }

        // Validate payload
        if (typeof payload !== 'object') {
            return { result: false, reason: 'Invalid payload' };
        }

        // Store input state - PhysicsHandler will apply forces
        ship.inputs = {
            up: payload.up === true,
            down: payload.down === true,
            left: payload.left === true,
            right: payload.right === true,
        };

        return { result: true };
    }
}