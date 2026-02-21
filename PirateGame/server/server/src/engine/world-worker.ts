// engine/world-worker.ts
import { parentPort } from "node:worker_threads";
import WorldFactory from "../application/world-factory";
import World from "./world";

let world: World;
let isInitialized = false;

parentPort?.postMessage({ type: 'READY' });  // Tell the manager this thread has started

// Wait until the manager sends config info
parentPort?.on('message', (message: any) => {
    
    // Create the world
    if (message.type === 'INIT') {
        world = WorldFactory.createWorld(message.worldId, message.config);
        isInitialized = true;
        startHeartbeat();
        return;
    }

    // Don't do anything if INIT hasn't happened
    if (!isInitialized) return;

    switch (message.type) {
        case 'PLAYER_JOINED':
            world.entityRegistry.createPlayer(message.playerId);
            break;

        case 'PLAYER_LEFT':
            world.entityRegistry.removePlayer(message.playerId);
            break;

        case 'PLAYER_ACTION':
            const response = world.handleAction(message.playerId, message.event, message.payload);
            
            // If the controller returned sync data, send it to the manager and to the client
            if (response && message.event === 'system:requestSync') {
                parentPort?.postMessage({ 
                    type: 'PLAYER_SYNC', 
                    playerId: message.playerId, 
                    data: response 
                });
            }
            break;
    }
});

function startHeartbeat() {
    setInterval(() => {
        world.update(); // Run physics/movement

        // Send the regular snapshot to everyone in the world
        parentPort?.postMessage({
            type: 'STATE_UPDATE',
            data: world.getSnapshot()
        });
    }, 1000 / 60);
}