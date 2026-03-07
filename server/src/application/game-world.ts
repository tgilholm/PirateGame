import GameEngine from "../engine/game-engine";
import EntityRegistry from "../engine/entity-registry";
import WorldController from "../controllers/world-controller";
import { PlayerAction, ServerEvent } from "@shared/socket-protocol";
import Player from "../entities/player";
import EntityFactory from "../entities/entity-factory";
import Ship from "../entities/ship";
import { EventEmitter } from "events";
import { CONFIG } from "../config";

export enum WorldEvent {
    GAME_STATE = "GAME_STATE"
}


/**
 * The GameWorld class abstracts the specifics of each game from the server. It emits
 * events listened to by the SocketService to deliver game state to each player.
 */
export default class GameWorld extends EventEmitter {
    private tickRate = CONFIG.TICK_RATE;
    private tickInterval?: NodeJS.Timeout;
    private lastTime: number = 0;
    private cachedState = null;

    /**
     * Creates a game world with the provided dependencies
     * @param registry all the entities in the game
     * @param entityFactory to create new entities
     * @param engine to update each system on a tick
     * @param controller to route player events to the right place
     */
    constructor(
        private registry: EntityRegistry,
        private entityFactory: EntityFactory,
        private engine: GameEngine,
        private controller: WorldController
    ) { super(); }

    /**
     * Starts the world at the specified tickrate
     */
    public start() {
        console.log(`[GameWorld] Starting game at ${this.tickRate} TPS`);
        this.lastTime = Date.now();
        this.tickInterval = setTimeout(() => this.tick(), 1000 / this.tickRate) as any;
    }

    /**
     * Stops the game
     */
    public stop() {
        if (this.tickInterval) clearTimeout(this.tickInterval);
        console.log(`[GameWorld] Game stopped`);
    }

    /**
     * Calculates physics, processes movement, and broadcasts state.
     */
    private tick() {
        const now = Date.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.engine.tick(dt);
        this.cachedState = null;
        this.broadcastGameState();

        // correct delays instead of using setInterval
        const elapsed = Date.now() - now;
        const delay = Math.max(0, (1000 / this.tickRate) - elapsed);
        this.tickInterval = setTimeout(() => this.tick(), delay) as any;
    }
    /**
     * Called by SocketService when a validated action arrives
     */
    public handleAction(socketId: string, action: PlayerAction) {
        this.controller.handle(socketId, action);
    }

    /**
     * Called by SocketService when a player says they are READY
     */
    public addPlayer(socketId: string, username: string) {

        // Spawn the player on their own ship
        const newShip = this.entityFactory.createShip(
            `ship_${socketId}`,
            2500,
            5000
        )

        const newPlayer = this.entityFactory.createPlayer(
            socketId,
            0,
            0,
            newShip,
            username,
        )
    }

    /**
     * Called by SocketService on disconnect
     */
    public removePlayer(socketId: string) {
        this.registry.delete(socketId);
        this.registry.delete(`ship_${socketId}`);   // remove their ship
    }

    /**
     * Serializes the delta/current state for the frequent tick broadcast
     */
    private broadcastGameState() {
        const state = {
            players: this.registry.getByType<Player>('player').map(p => p.serialise()),
            ships: this.registry.getByType<Ship>('ship').map(s => s.serialise())
        };

        this.emit(WorldEvent.GAME_STATE, state);
    }

    /**
     * Provides the initial state for newly connected clients
     */
    public getFullState() {
        return {
            players: this.registry.getByType<Player>('player').map(p => p.serialise()),
            ships: this.registry.getByType<Ship>('ship').map(s => s.serialise()),
        };
    }
}