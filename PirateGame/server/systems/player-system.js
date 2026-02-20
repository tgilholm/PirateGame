import EntityRegistry from "../engine/entity-registry.js";

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
        moveInput: PlayerSystem.moveInput,
        takeControl: PlayerSystem.takeControl,
        releaseControl: PlayerSystem.releaseControl,
        exitShip: PlayerSystem.exitShip,
        enterShip: PlayerSystem.enterShip
    };

    static moveInput(playerId, payload) {
        const player = EntityRegistry.getPlayer(playerId);
        if (!player) {
            return { result: false, reason: `Player: ${playerId} not found` };
        }

        // Validate payload
        if (typeof payload !== 'object') {
            return { result: false, reason: 'Invalid payload' };
        }

        // Store input state
        player.inputs = {
            up: payload.up === true,
            down: payload.down === true,
            left: payload.left === true,
            right: payload.right === true,
        };

        return { result: true };
    }

    static takeControl(playerId, payload) {
        const player = EntityRegistry.getPlayer(playerId);
        const ship = EntityRegistry.getShip(payload.shipId);

        // Guard against duplicate pilots, not on ship, etc.
        if (!player) {
            return { result: false, reason: `Player: ${playerId} not found` };
        }
        if (!ship) {
            return { result: false, reason: `Ship could not be found` };
        }
        if (ship.pilotId) {
            return { result: false, reason: `Ship: ${ship.id} already has a pilot` };
        }
        if (player.parentId !== ship.id) {
            return { result: false, reason: `Player: ${playerId} is not on ship ${ship.id}` };
        }

        // Calculate distance between player and the helm
        const helm = ship.params.interactables.helm;
        const dist = this.distance(
            player.position.x, player.position.y,
            helm.x, helm.y
        );
        if (dist > 50) {
            return { result: false, reason: `Player: ${playerId} is too far from helm, cannot control ship: ${ship.id}` };
        }

        // If all checks succeed, give player control
        ship.pilotId = playerId;
        player.isSteering = true;

        return { result: true };
    }

    static releaseControl(playerId, payload) {
        const player = EntityRegistry.getPlayer(playerId);
        const ship = EntityRegistry.getShip(payload.shipId);

        if (!player || !ship) {
            return { result: false, reason: `'Entity not found' ` };
        }
        if (ship.pilotId !== playerId) {
            return { result: false, reason: `Player ${playerId} is not piloting ship ${ship.id}, cannot release control` };
        }

        // Stop steering, kick them off the helm
        ship.pilotId = null;
        player.isSteering = false;
        player.inputs = {};  // Clear inputs

        return { result: true };
    }

    static exitShip(playerId, payload) {
        const player = EntityRegistry.getPlayer(playerId);
        const ship = EntityRegistry.getShip(payload.shipId);

        if (!player || !ship) {
            return { result: false, reason: 'Entity not found' };
        }
        if (player.parentId !== ship.id) {
            return { result: false, reason: `Player ${playerId} is not on ship ${ship.id}, cannot exit` };
        }

        // Check distance between player and ladders
        const ladders = ship.params.interactables.ladders;
        let nearLadder = false;
        for (const ladder of ladders) {
            const dist = this.distance(
                player.position.x, player.position.y,
                ladder.x, ladder.y
            );
            if (dist < 50) {
                nearLadder = true;
                break;
            }
        }

        if (!nearLadder) {
            return { result: false, reason: `Player ${playerId} is not near a ladder, cannot exit` };
        }

        // convert local position to world position
        const worldPos = ship.localToWorld(player.position.x, player.position.y);
        player.position.x = worldPos.x;
        player.position.y = worldPos.y;
        player.parentId = null;
        player.isSteering = false;

        return { result: true };
    }

    static enterShip(playerId, payload) {
        const player = EntityRegistry.getPlayer(playerId);
        const ship = EntityRegistry.getShip(payload.shipId);

        if (!player || !ship) {
            return { result: false, reason: 'Entity not found' };
        }
        if (player.parentId !== null) {
            return { result: false, reason: `Player ${playerId} is already on a ship, cannot board`};
        }

        const ladders = ship.params.interactables.ladders;
        const ladderIndex = payload.ladderIndex;

        if (ladderIndex < 0 || ladderIndex >= ladders.length) {
            return { result: false, reason: `Player ${playerId} could not board, ladder not found`};
        }

        const ladder = ladders[ladderIndex];
        const dist = this.distance(
            player.position.x, player.position.y,
            ladder.x, ladder.y
        );

        if (dist > 50) {
            return { result: false, reason: `Player ${playerId} could not board, too far from ladder`};
        }

        // convert world position to ship-local position
        const localPos = ship.worldToLocal(player.position.x, player.position.y);
        player.position.x = localPos.x;
        player.position.y = localPos.y;
        player.parentId = ship.id;

        return { result: true };
    }

    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}