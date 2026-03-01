// engine/world-worker.ts
import { parentPort } from "node:worker_threads";
import WorldFactory from "../application/world-factory";
import World from "./world";
import { WorkerEvent } from "../application/world-manager";
import { CONFIG } from "../config";
import { EntityConfig } from "../../types";

let world: World;
let isInitialized = false;
let worldFactory: WorldFactory;
let entityConfig: EntityConfig;
let worldConfig: any;

parentPort?.postMessage({ type: WorkerEvent.READY });  // Tell the manager this thread has started

// Wait until the manager sends config info
parentPort?.on('message', (message: any) => {

    // Create the world
    if (message.type === WorkerEvent.INIT) {
        entityConfig = message.entityConfig;
        worldConfig = message.worldConfig;

        // Create the factory
        worldFactory = new WorldFactory(entityConfig, worldConfig);

        world = worldFactory.createWorld(message.worldId);
        isInitialized = true;
        startHeartbeat();
        return;
    }

    // Don't do anything if INIT hasn't happened
    if (!isInitialized) return;

    switch (message.type) {
        case WorkerEvent.JOINED:
            world.createPlayer(message.playerId, message.username);
            break;

        case WorkerEvent.LEFT:
            world.removePlayer(message.playerId);
            break;

        case WorkerEvent.ACTION:
            const response = world.handleAction(message.playerId, message.action);
            break;
        case WorkerEvent.SYNC:

            parentPort?.postMessage({
                type: WorkerEvent.SYNC,
                playerId: message.playerId,
                data: world.getFullSync()
            });
            break;
    }
});


// TODO-  Improve interval method and account for time fluctuation

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