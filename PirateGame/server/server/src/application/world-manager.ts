import { Worker } from 'node:worker_threads'  // use node.js workers instead of default js ones
import WorldFactory from "./world-factory";
import { EventEmitter } from 'node:stream';
import { ManagerEvent } from './socket-service';

export enum WorkerEvent {
    READY = 'READY',
    INIT = 'INIT',
    STATE_UPDATE = 'STATE_UPDATE',
    PLAYER_JOINED = 'PLAYER_JOINED',
    PLAYER_LEFT = 'PLAYER_LEFT',
    PLAYER_ACTION = 'PLAYER_ACTION',
    PLAYER_SYNC = 'PLAYER_SYNC',
}

/**
 * Executed in the main thread; launches new "worlds" in separate threads executed by Workers (node.js)
 * WorldManager and SocketHandler exist in a pub/sub pattern
 */
export default class WorldManager extends EventEmitter {
    private worlds: Map<string, Worker> = new Map();    // Each world runs in a separate thread
    private playerToWorld: Map<string, string> = new Map(); // Links players to worlds

    constructor(private worldFactory: WorldFactory) { super(); }

    /**
     * Starts a new worker thread with the worldID and sets up listeners to respond
     * to status information from the worker
     */
    public createWorld() {
        const worldId = `world_${Date.now()}`;

        // Note the .js suffix- run npm build before trying to start!!!
        const worker = new Worker('./built/engine/world-worker.js');

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
                    config: this.worldFactory.getSharedConfig()
                });
            } else if (message.type === WorkerEvent.STATE_UPDATE) {

                // Send the data to be broadcasted back to all clients in that world
                this.emit(ManagerEvent.WORLD_STATE_UPDATE, worldId, message.data);

                // After player:ready is received, the worker thread sends back the world data
            } else if (message.type === WorkerEvent.PLAYER_SYNC) {
                // Send it to the player
                this.emit(ManagerEvent.PLAYER_SYNC, message.playerId, message.data);
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
    public routeAction(playerId: string, event: string, payload: any) {

        const worker = this.getWorker(playerId);

        if (worker) {
            worker.postMessage({
                type: WorkerEvent.PLAYER_ACTION, playerId, event, payload
            });
        }
    }

    /**
     * Sends a request to the worker thread to add a player to the world
     * @param playerId the id of the socket from which the event was sent
     * @param worldId the id of the world the player is attempting to join
     * @returns {boolean} true if the joining succeeded, false otherwise
     */
    public joinWorld(playerId: string, worldId: string): boolean {
        // Get the world by the provided id
        const worker = this.worlds.get(worldId);
        if (!worker) return false;

        this.playerToWorld.set(playerId, worldId);
        worker.postMessage({ type: WorkerEvent.PLAYER_JOINED, playerId });
        return true;
    }

    /**
     * Sends a request to the worker thread to remove a player from the world
     * @param playerId the id of the socket from which the event was sent
     */
    public leaveWorld(playerId: string) {
        const worldId = this.playerToWorld.get(playerId);
        if (worldId) {
            this.worlds.get(worldId)?.postMessage({ type: WorkerEvent.PLAYER_LEFT, playerId });
            this.playerToWorld.delete(playerId);
        }
    }

    /**
     * Returns the ID of the world the player is in
     * @param playerId the id of the player from which to find their world
     */
    public getPlayerWorldId(playerId: string): string | undefined {
        return this.playerToWorld.get(playerId);
    }

    /**
     * Helper method to retrieve a worker and 
     * @param playerId the socket id of a player
     * @returns a Worker thread, or null if it cannot be found
     */
    private getWorker(playerId: string): Worker | null {
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
    private handleWorkerDeath(worldId: string) {
        this.worlds.delete(worldId);

        // Kick every player in that world from the game
        for (const [playerId, playerWorldId] of this.playerToWorld.entries()) {
            if (playerWorldId === worldId) {
                this.playerToWorld.delete(playerId);
                this.emit(ManagerEvent.PLAYER_KICKED, playerId, 'World Crashed');
            }
        }
    }
}