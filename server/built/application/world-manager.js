"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerEvent = exports.ManagerEvent = void 0;
const node_worker_threads_1 = require("node:worker_threads"); // use node.js workers instead of default js ones
const node_stream_1 = require("node:stream");
var ManagerEvent;
(function (ManagerEvent) {
    ManagerEvent["WORLD_STATE_UPDATE"] = "WORLD_STATE_UPDATE";
    ManagerEvent["SYNC"] = "PLAYER_SYNC";
    ManagerEvent["KICKED"] = "PLAYER_KICKED";
})(ManagerEvent || (exports.ManagerEvent = ManagerEvent = {}));
var WorkerEvent;
(function (WorkerEvent) {
    WorkerEvent["READY"] = "READY";
    WorkerEvent["INIT"] = "INIT";
    WorkerEvent["STATE_UPDATE"] = "STATE_UPDATE";
    WorkerEvent["JOINED"] = "PLAYER_JOINED";
    WorkerEvent["LEFT"] = "PLAYER_LEFT";
    WorkerEvent["ACTION"] = "PLAYER_ACTION";
    WorkerEvent["SYNC"] = "PLAYER_SYNC";
})(WorkerEvent || (exports.WorkerEvent = WorkerEvent = {}));
/**
 * Executed in the main thread; launches new "worlds" in separate threads executed by Workers (node.js)
 * WorldManager and SocketHandler exist in a pub/sub pattern
 */
class WorldManager extends node_stream_1.EventEmitter {
    entityConfig;
    worlds = new Map(); // Each world runs in a separate thread
    playerToWorld = new Map(); // Links players to worlds
    constructor(entityConfig) {
        super();
        this.entityConfig = entityConfig;
    }
    /**
     * Starts a new worker thread with the worldID and sets up listeners to respond
     * to status information from the worker
     */
    createWorld(worldConfig) {
        const worldId = `world_${Date.now()}`;
        // Note the .js suffix- run npm build before trying to start!!!
        const worker = new node_worker_threads_1.Worker('./built/engine/world-worker.js');
        /*
        message: {
        type,
        data
        }
        */
        // Handle status messages from worker threads
        worker.on('message', (message) => {
            if (message.type === WorkerEvent.READY) {
                // Worker has started- send the config
                worker.postMessage({
                    type: WorkerEvent.INIT,
                    worldId: worldId,
                    entityConfig: this.entityConfig,
                    worldConfig: worldConfig
                });
            }
            else if (message.type === WorkerEvent.STATE_UPDATE) {
                // Send the data to be broadcasted back to all clients in that world
                this.emit(ManagerEvent.WORLD_STATE_UPDATE, worldId, message.data);
                // After player:ready is received, the worker thread sends back the world data
            }
            else if (message.type === WorkerEvent.SYNC) {
                // Send it to the player
                this.emit(ManagerEvent.SYNC, message.playerId, message.data);
            }
        });
        // Error handling for worlds
        worker.on('error', (error) => {
            // Remove the dead thread from the map & log error message
            console.log(`[WorldManager] Worker thread threw an error`, error);
            this.handleWorkerDeath(worldId);
        });
        worker.on('exit', (code) => {
            if (code !== 0) // success code
             {
                console.error(`[WorldManager] Worker ${worldId} exited with code ${code}`);
                this.handleWorkerDeath(worldId);
            }
        });
        // Add to map
        this.worlds.set(worldId, worker);
        console.log(`[WorldManager] Created worker thread: ${worldId}`);
    }
    /**
     * Directs an event message sent from a player to the worker thread currently
     * hosting the World in which that player exists.
     * @param playerId the ID of the socket from which the event was sent
     * @param event the event code
     * @param payload any parameters sent by the player to execute the event
     */
    routeAction(playerId, action) {
        const worker = this.getWorker(playerId);
        if (worker) {
            worker.postMessage({
                type: WorkerEvent.ACTION, playerId, action: action
            });
        }
    }
    /**
     * Sends a request to the worker thread to add a player to the world
     * @param playerId the id of the socket from which the event was sent
     * @param worldId the id of the world the player is attempting to join
     * @returns {boolean} true if the joining succeeded, false otherwise
     */
    joinWorld(playerId, worldId, username) {
        // Get the world by the provided id
        const worker = this.worlds.get(worldId);
        if (!worker)
            return false;
        this.playerToWorld.set(playerId, worldId);
        worker.postMessage({ type: WorkerEvent.JOINED, playerId, username });
        return true;
    }
    /**
     * Sends a request to the worker thread to remove a player from the world
     * @param playerId the id of the socket from which the event was sent
     */
    leaveWorld(playerId) {
        const worldId = this.playerToWorld.get(playerId);
        if (worldId) {
            this.worlds.get(worldId)?.postMessage({ type: WorkerEvent.LEFT, playerId });
            this.playerToWorld.delete(playerId);
        }
    }
    /**
     * Returns the ID of the world the player is in
     * @param playerId the id of the player from which to find their world
     */
    getPlayerWorldId(playerId) {
        return this.playerToWorld.get(playerId);
    }
    /**
     * Sends a message to the worker thread of the requested world to retrieve a full sync
     * @param playerId the id of a player in the world
     */
    requestSync(playerId) {
        const worker = this.getWorker(playerId);
        if (worker) {
            worker.postMessage({ type: WorkerEvent.SYNC, playerId });
        }
    }
    /**
     * Helper method to retrieve a worker and
     * @param playerId the socket id of a player
     * @returns a Worker thread, or null if it cannot be found
     */
    getWorker(playerId) {
        // Find the world the player is in
        const worldId = this.playerToWorld.get(playerId);
        // Check if the world exists
        if (!worldId || worldId === undefined) {
            console.log(`[WorldManager] Failed to find world ${worldId}`);
            return null;
        }
        const worker = this.worlds.get(worldId);
        if (!worker) {
            console.log(`[WorldManager] Failed to find worker for world: ${worldId}`);
            return null;
        }
        return worker;
    }
    /**
     * Gracefully handle "world crashes" if a worker thread stops running. Removes all
     * players from the game and deletes the worker from the map.
     * @param worldId the id of the world/worker that has stopped
     */
    handleWorkerDeath(worldId) {
        this.worlds.delete(worldId);
        // Kick every player in that world from the game
        for (const [playerId, playerWorldId] of this.playerToWorld.entries()) {
            if (playerWorldId === worldId) {
                this.playerToWorld.delete(playerId);
                this.emit(ManagerEvent.KICKED, playerId, 'World Crashed');
            }
        }
    }
}
exports.default = WorldManager;
