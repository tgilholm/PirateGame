import GameEngine from "../engine/game-engine";
import EntityRegistry from "../engine/entity-registry";
import WorldController from "../controllers/world-controller";
import { PlayerAction } from "@shared/socket-protocol";
import Player from "../entities/player";
import EntityFactory from "../entities/entity-factory";
import Ship from "../entities/ship";
import { EventEmitter } from "events";
import { CONFIG } from "../config";
import PhysicsSystem from "../systems/physics-system";
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
    knownEntityIds: Set<string>;
}

/**
 * The GameWorld class abstracts the specifics of each game from the server. It emits
 * events listened to by the SocketService to deliver game state to each player.
 */
export default class GameWorld extends EventEmitter {
    private tickRate = CONFIG.TICK_RATE;
    private tickInterval?: NodeJS.Timeout;
    private lastTime: number = 0;
    private sessions: Map<string, ClientSession> = new Map();

    constructor(
        private registry: EntityRegistry,
        private entityFactory: EntityFactory,
        private engine: GameEngine,
        private controller: WorldController,
        private grid: SpatialGrid
    ) {
        super();
    }

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
        this.broadcastGameState();

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
        const newShip = this.entityFactory.createShip(`ship_${socketId}`, 2500, 5000);

        const physics = this.engine.systems.get("physics") as PhysicsSystem;
        physics.addBody(newShip.body);

        this.entityFactory.createPlayer(
            socketId,
            0,
            0,
            newShip,
            username,
        );

        this.sessions.set(socketId, {
            socketId,
            knownEntityIds: new Set()
        });
    }

    /**
     * Called by SocketService on disconnect
     */
    public removePlayer(socketId: string) {
        this.registry.delete(socketId);

        const physics = this.engine.systems.get("physics") as PhysicsSystem;
        const ship = this.registry.get<Ship>(`ship_${socketId}`);

        if (ship) {
            physics.removeBody(ship.body);
            this.registry.delete(`ship_${socketId}`);
        }

        this.grid.remove(socketId);
        this.grid.remove(`ship_${socketId}`);
        this.sessions.delete(socketId);
    }

    /**
     * Builds a generic full/delta map for every non-interactable entity,
     * including treasure.
     */
    private buildEntityData(): Map<string, { full: any; delta: any }> {
        const entityData = new Map<string, { full: any; delta: any }>();

        this.registry.getAllExcluding("interactable").forEach(e => {
            const wx = e.parent ? e.parent.x : e.x;
            const wy = e.parent ? e.parent.y : e.y;

            this.grid.update(e.id, wx, wy);

            entityData.set(e.id, {
                full: e.serialise(),
                delta: e.serialiseDelta()
            });
        });

        return entityData;
    }

    /**
     * Creates a personalised update packet for each player.
     * Treasure works automatically here because it is just another entity type.
     */
    private broadcastGameState() {
        const entityData = this.buildEntityData();

        this.emit(WorldEvent.GAME_STATE_PER_PLAYER, (socketId: string) => {
            const session = this.sessions.get(socketId);
            const player = this.registry.get<Player>(socketId);

            if (!session || !player) return null;

            const wx = player.parent ? player.parent.x : player.x;
            const wy = player.parent ? player.parent.y : player.y;
            const nearbyIds = this.grid.getNearby(wx, wy);

            const newEntities: any[] = [];
            const deltaEntities: any[] = [];
            const removedIds: string[] = [];

            nearbyIds.forEach(id => {
                const data = entityData.get(id);
                if (!data) return;

                if (!session.knownEntityIds.has(id)) {
                    newEntities.push(data.full);
                    session.knownEntityIds.add(id);
                } else if (data.delta) {
                    deltaEntities.push(data.delta);
                }
            });

            for (const id of Array.from(session.knownEntityIds)) {
                if (!nearbyIds.has(id) || !entityData.has(id)) {
                    session.knownEntityIds.delete(id);
                    removedIds.push(id);
                }
            }

            if (!newEntities.length && !deltaEntities.length && !removedIds.length) {
                return null;
            }

            return { newEntities, deltaEntities, removedIds };
        });
    }

    /**
     * Initial full sync for a newly joined player.
     * Treasure is included automatically because it is a normal entity.
     */
    public getFullState() {
        return {
            entities: this.registry.getAllExcluding("interactable").map(e => e.serialise())
        };
    }
}