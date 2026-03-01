import GameEngine from "../engine/game-engine";
import Server from "socket.io"
import EntityRegistry from "../engine/entity-registry";
import WorldController from "../controllers/world-controller";
import { PlayerAction, ServerEvent } from "shared/socket-protocol";
import Player from "../entities/player";
import EntityFactory from "../entities/entity-factory";
import Ship from "../entities/ship";
import { EventEmitter } from "events";

export default class GameWorld extends EventEmitter{
    private tickRate = 20; // 20 Ticks Per Second (50ms per tick)
    private tickInterval?: NodeJS.Timeout;
    private lastTime: number = 0;

    constructor(
        private io: Server,
        private registry: EntityRegistry,
        private entityFactory: EntityFactory,
        private engine: GameEngine,
        private controller: WorldController
    ) {}

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
     * The Heartbeat: Calculates physics, processes movement, and broadcasts state.
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
        // The WorldController safely routes this to the Player/Ship controllers
        this.controller.handle(socketId, action);
    }

    /**
     * Called by SocketService when a player says they are READY
     */
    public addPlayer(socketId: string, username: string) {
        // Spawn the player on their own ship

        const newShip = this.entityFactory.createShip(
            5000, 
            5000
        )
        this.registry.create(newShip);

        const newPlayer = this.entityFactory.createPlayer(
            0,
            0,
            newShip,
            username,
        )
        this.registry.create(newPlayer);

        // Send this specific player the FULL world state so they can load in
        this.io.to(socketId).emit(ServerEvent.INIT_GAME, this.getFullState());
    }

    /**
     * Called by SocketService on disconnect
     */
    public removePlayer(socketId: string) {
        this.registry.delete(socketId);
        // Note: You might want logic here to remove them from a ship's crew, etc.
    }

    /**
     * Serializes the delta/current state for the frequent tick broadcast
     */
    private broadcastGameState() {
        const state = {
            // Map over entities and call a .serialize() or .toDTO() method
            players: this.registry.getByType<Player>('player').map(p => p.serialise()),
            ships: this.registry.getByType<Ship>('ship').map(s => s.serialise())
        };

        this.io.emit(ServerEvent.GAME_STATE, state);
    }

    /**
     * Provides the massive initial state for newly connected clients
     */
    public getFullState() {
        return {
            players: this.registry.getByType<Player>('player').map(p => p.serialise()),
            ships: this.registry.getByType<Ship>('ship').map(s => s.serialise()),
            // Full state might also include static items, active loot crates, etc.
        };
    }
}