// engine/world-worker.ts
import { parentPort } from "node:worker_threads";
import WorldFactory from "../application/world-factory";
import World from "./world";
import { WorkerEvent } from "../application/world-manager";
import { CONFIG } from "../config";
import { ClientEvent } from "../shared/socket-protocol";

let world: World;
let isInitialized = false;

parentPort?.postMessage({ type: WorkerEvent.READY });  // Tell the manager this thread has started

// Wait until the manager sends config info
parentPort?.on('message', (message: any) => {
    
    // Create the world
    if (message.type === WorkerEvent.INIT) {
        world = WorldFactory.createWorld(message.worldId, message.config);
        isInitialized = true;
        startHeartbeat();
        return;
    }

    // Don't do anything if INIT hasn't happened
    if (!isInitialized) return;

    switch (message.type) {
        case WorkerEvent.PLAYER_JOINED:
            world.entityRegistry.createPlayer(message.playerId);
            break;

        case WorkerEvent.PLAYER_LEFT:
            world.entityRegistry.removePlayer(message.playerId);
            break;

        case WorkerEvent.PLAYER_ACTION:
            const response = world.handleAction(message.playerId, message.event, message.payload);
            
            // If the controller returned sync data, send it to the manager and to the client
            if (response && message.event === ClientEvent.PLAYER_REQUEST_SYNC) {
                parentPort?.postMessage({ 
                    type: WorkerEvent.PLAYER_SYNC, 
                    playerId: message.playerId, 
                    data: response 
                });
            }
            break;
    }
});



function startHeartbeat() {
    // Keep track of last time to account for fluctuations
    let lastTick = performance.now();
    const TARGET_DELTA = 1000 / CONFIG.TICK_RATE;




    setInterval(() => {
        world.update(); // Run physics/movement

        // Send the regular snapshot to everyone in the world
        parentPort?.postMessage({
            type: 'STATE_UPDATE',
            data: world.getSnapshot()
        });
    }, 1000 / 60);
}