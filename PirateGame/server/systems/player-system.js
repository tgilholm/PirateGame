export default class PlayerSystem {
    /**
     * Routes an event by its name to the relevant method. If the event
     * cannot be found, returns safely. Note that event names for player events
     * must be given as "player:doSomething";
     * @param {String} playerId 
     * @param {String} eventName 
     * @param {Object} payload 
     */
    static handle(playerId, eventName, payload) {
        if (!eventName || eventName.split(":")[0] !== "player") {
            return {result: false, reason: `Could not parse event name`};
        }

        const action = eventName.split(':')[1];     // extract the action - "doStuff"

        // Check for invalid actions
        const handlers = this.handlers[action];
        if (!handlers) return { result: false, reason: `Unknown action: ${action}` };

        // Route to the specific method with the event data
        return handlers.call(this, playerId, payload);
    }

    static handlers = {
        moveInput: PlayerSystem.moveInput,
        takeControl: PlayerSystem.takeControl,
        releaseControl: PlayerSystem.releaseControl,
        exitShip: PlayerSystem.exitShip,
        enterShip: PlayerSystem.enterShip
    };

    static moveInput(playerId, payload)
    {

    }

    static takeControl(playerId, payload)
    {

    }

    static releaseControl(playerId, payload)
    {

    }

    static exitShip(playerId, payload)
    {

    }

    static enterShip(playerId, payload)
    {

    }
}