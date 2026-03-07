import GameEngine from "../engine/game-engine";
import EntityRegistry from "../engine/entity-registry";
import WorldController from "../controllers/world-controller";
import { PlayerAction, ServerEvent } from "@shared/socket-protocol";
import Player from "../entities/player";
import EntityFactory from "../entities/entity-factory";
import Ship from "../entities/ship";
import { EventEmitter } from "events";
import { CONFIG } from "../config";
import PhysicsSystem from "src/systems/physics-system";
import SpatialGrid from "./spatial-grid";

/**
 * Communication contract between this game world and the socket service
 */
export enum WorldEvent {
    GAME_STATE = "GAME_STATE",
    GAME_STATE_PER_PLAYER = "GAME_STATE_PER_PLAYER"
}

/**
 * Used to determine whether a full state or delta is required for an entity
 */
interface ClientSession {
    socketId: string;
    knownEntityIds: Set<string>;    // the entities this client "knows" about already
}


/**
 * The GameWorld class abstracts the specifics of each game from the server. It emits
 * events listened to by the SocketService to deliver game state to each player.
 */
export default class GameWorld extends EventEmitter {
    private tickRate = CONFIG.TICK_RATE;
    private tickInterval?: NodeJS.Timeout;
    private lastTime: number = 0;
    private grid = new SpatialGrid(512, 1024); // 512px cells, 1024px view distance.  
    private sessions: Map<string, ClientSession> = new Map();   // state held by each client

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
        this.updateGrid();  // must be after the engine tick
        this.broadcastGameState();

        // correct delays instead of using setInterval
        const elapsed = Date.now() - now;
        const delay = Math.max(0, (1000 / this.tickRate) - elapsed);
        this.tickInterval = setTimeout(() => this.tick(), delay) as any;
    }

    /**
     * Updates the SpatialGrid with the current entity positions after updating their phyiscs
     */
    private updateGrid() {
        this.registry.getByType<Player>('player').forEach(p => {
            const wx = p.parent ? p.parent.x : p.x;
            const wy = p.parent ? p.parent.y : p.y;
            this.grid.update(p.id, wx, wy);
        });
        this.registry.getByType<Ship>('ship').forEach(s => {
            this.grid.update(s.id, s.x, s.y);
        });
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
        const newShip = this.entityFactory.createShip(`ship_${socketId}`, 2500, 5000);

        // "hacky" way of adding to the physics world
        const physics = this.engine.systems.get('physics') as PhysicsSystem;
        physics.addBody(newShip.body);

        const newPlayer = this.entityFactory.createPlayer(
            socketId,
            0,
            0,
            newShip,
            username,
        );

        // No known entities for new players
        this.sessions.set(socketId, {
            socketId,
            knownEntityIds: new Set()   // empty set to start
        });
    }

    /**
     * Called by SocketService on disconnect
     */
    public removePlayer(socketId: string) {
        this.registry.delete(socketId);

        // remove the matter body
        const physics = this.engine.systems.get('physics') as PhysicsSystem;
        const ship = this.registry.get<Ship>(`ship_${socketId}`);

        if (ship) {
            physics.removeBody(ship.body);  // remove the ship's physics body
            this.registry.delete(`ship_${socketId}`);   // remove their ship
        }

        // Remove them from the spatial grid and the session list
        this.grid.remove(socketId);
        this.grid.remove(`ship_${socketId}`);
        this.sessions.delete(socketId);
    }

    /**
     * Creates a "personalised" update packet for each player, containing only
     * the entities that have changed recently and are within a reasonable distance of them.
     * Entities that are new to the client will be sent with a full state. Entities close to the client
     * receive a delta (what changed since the last broadcast), and entities that leave the view
     * range of the client are "invisible" to it and are not sent.
     */
    private broadcastGameState() {
        // Compute once and reuse for every client session
        const playerData = new Map<string, { full: any, delta: any }>();
        const shipData = new Map<string, { full: any, delta: any }>();

        this.registry.getByType<Player>('player').forEach(p => {
            playerData.set(p.id, {
                delta: p.serialiseDelta(),
                full: p.serialise(),
            });
        });
        this.registry.getByType<Ship>('ship').forEach(s => {
            shipData.set(s.id, {
                delta: s.serialiseDelta(),
                full: s.serialise(),
            });
        });

        this.emit(WorldEvent.GAME_STATE_PER_PLAYER, (socketId: string) => {
            const session = this.sessions.get(socketId);
            const player = this.registry.get<Player>(socketId);
            if (!session || !player) return null;

            const wx = player.parent ? player.parent.x : player.x;
            const wy = player.parent ? player.parent.y : player.y;
            const nearbyIds = this.grid.getNearby(wx, wy);

            const newPlayers: any[] = [];
            const deltaPlayers: any[] = [];
            const newShips: any[] = [];
            const deltaShips: any[] = [];
            const removedIds: string[] = []; // for entities out of range

            // Add nearby entities to packet
            nearbyIds.forEach(id => {
                const pd = playerData.get(id);
                if (pd) {
                    if (!session.knownEntityIds.has(id)) {
                        newPlayers.push(pd.full);
                        session.knownEntityIds.add(id);
                    } else if (pd.delta) {
                        deltaPlayers.push(pd.delta);
                    }
                    return;
                }
                const sd = shipData.get(id);
                if (sd) {
                    if (!session.knownEntityIds.has(id)) {
                        newShips.push(sd.full);
                        session.knownEntityIds.add(id);
                    } else if (sd.delta) {
                        deltaShips.push(sd.delta);
                    }
                }
            });

            // Remove out-of-range entities
            session.knownEntityIds.forEach(id => {
                if (!nearbyIds.has(id)) {
                    session.knownEntityIds.delete(id);
                    removedIds.push(id); // Tell the client to drop the out-of-range entity
                }
            });

            if (!newPlayers.length && !newShips.length && !deltaPlayers.length && !deltaShips.length && !removedIds.length) {
                return null;
            }

            // Send the data to the client
            return { newPlayers, newShips, deltaPlayers, deltaShips, removedIds };
        });
    }

    /**
     * Provides the initial (non-delta-encoded) state to players who have just joined.
     * After this point, clients receive updates only for objects that have changed.
     */
    public getFullState() {
        return {
            players: this.registry.getByType<Player>('player').map(p => p.serialise()),
            ships: this.registry.getByType<Ship>('ship').map(s => s.serialise()),
        };
    }
}