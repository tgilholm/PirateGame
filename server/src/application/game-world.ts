import GameEngine from "../engine/game-engine";
import EntityRegistry from "../engine/entity-registry";
import WorldController from "../controllers/world-controller";
import { PlayerAction, ServerEvent } from "@shared/socket-protocol";
import Player from "../entities/player";
import EntityFactory from "../entities/entity-factory";
import Ship from "../entities/ship";
import { EventEmitter } from "events";

export enum WorldEvent {
    GAME_STATE = "GAME_STATE"
}


export default class GameWorld extends EventEmitter {
    private tickRate = 20; // 20 Ticks Per Second (50ms per tick)
    private tickInterval?: NodeJS.Timeout;
    private lastTime: number = 0;

    constructor(
        private registry: EntityRegistry,
        private entityFactory: EntityFactory,
        private engine: GameEngine,
        private controller: WorldController
    ) { super(); }

    /**
     * Boot up the world loop
     */
    public start() {
        console.log(`[GameWorld] Starting game at ${this.tickRate} TPS`);
        this.lastTime = Date.now();
        this.tickInterval = setInterval(() => this.tick(), 1000 / this.tickRate);
    }

    public stop() {
        if (this.tickInterval) clearInterval(this.tickInterval);
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
        this.broadcastGameState();
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
            5000,
            5000
        )
        this.registry.create(newShip);

        const newPlayer = this.entityFactory.createPlayer(
            socketId,
            0,
            0,
            newShip,
            username,
        )
        this.registry.create(newPlayer);
    }

    /**
     * Called by SocketService on disconnect
     */
    public removePlayer(socketId: string) {
        this.registry.delete(socketId);
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