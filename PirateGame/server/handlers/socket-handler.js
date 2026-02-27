import EntityRegistry from "../engine/entity-registry.js";
import GameEngine from "../engine/game-engine.js";
import NpcSystem from "../systems/npc-system.js"
import PlayerSystem from "../systems/player-system.js"
import ShipSystem from "../systems/ship-system.js"
import { CONFIG } from "../config.js";
import leaderboard from "../leaderboard.js";

const systems = {
    player: PlayerSystem,
    ship: ShipSystem
    //npc_event: NpcSystem.handle
};

export default class SocketHandler {
    /**
     *
     * @param io
     * @param {GameEngine} gameEngine
     * @param {leaderboard} leaderboard
     */
    constructor(io, gameEngine,leaderboard) {
        this.io = io;
        this.gameEngine = gameEngine;
        this.leaderboard = leaderboard;
    }



    /**
     * 
     */
    handleConnect(socket) {

        // get some npc data and send it here

        socket.on('system:playerReady', (payload) => {
            console.log("[SocketHandler] Received new player")

            const player = EntityRegistry.createPlayer(socket.id, CONFIG.SPAWN.PLAYER.X, CONFIG.SPAWN.PLAYER.Y, "ship_1", "");


            
            if (!player) {
                console.log(`[SocketHandler] Player: ${socket.id} not found`);
            }

            // Validate payload
            if (typeof payload !== 'object') {
                console.log(`[SocketHandler] Invalid payload`);
            }

            // Store username
            player.username = payload.username;

            this.leaderboard.upsertPlayer(socket.id, player.username);

            // send to joined player
            socket.emit("leaderboard:update", this.leaderboard.top());

            // and broadcast to everyone (so names appear immediately)
            this.io.emit("leaderboard:update", this.leaderboard.top());

            const shipData = EntityRegistry.getShipData()
            const playerData = EntityRegistry.getPlayerData();

            socket.emit('initGame', { shipData, playerData });
            //console.log(shipData, playerData);
            console.log("[SocketHandler] Dispatching initGame event")
        })
        this.registerHandlers(socket);
    }

    /**
     * 
     */
    handleDisconnect(socket) {
        const playerId = socket.id;

        // If player was steering, release control
        const pilotedShip = EntityRegistry.getShipPilotedBy(playerId);
        if (pilotedShip) {
            PlayerSystem.handle(playerId, 'player:releaseControl', {
                shipId: pilotedShip.id
            });
        }

        EntityRegistry.removeEntity(playerId); // Remove from the game
        this.leaderboard.removePlayer(socket.id);
        this.io.emit("leaderboard:update", this.leaderboard.top());
        this.broadcastConnectedPlayers();
    }

    /**
     * 
     */
    registerHandlers(socket) {
        // Route to the related system this calls the "handle" method in each system class
        socket.on("leaderboard:setScore", ({ score }) => {
            this.leaderboard.setScore(socket.id, score);
            this.io.emit("leaderboard:update", this.leaderboard.top());
        });

        socket.on("leaderboard:addScore", ({ delta }) => {
            this.leaderboard.addScore(socket.id, delta);
            socket.emit("leaderboard:addScore", { delta: 1 });
            socket.emit("leaderboard:setScore", { score: 8 });
            this.io.emit("leaderboard:update", this.leaderboard.top());
        });

        socket.onAny((eventName, payload) => {
            //console.log(eventName);
            const [namespace, action] = eventName.split(':');

            if (eventName === "system:playerReady") return;
            if (eventName === "player:moveInput") {
                const playerId = socket.id;
                const player = EntityRegistry.getPlayer(playerId);

                if (player && player.isSteering && player.parentId) {
                    // Redirect the input to the ShipSystem if steering a ship
                    ShipSystem.handle(playerId, 'ship:moveInput', {
                        ...payload,
                        shipId: player.parentId
                    });
                } else {
                    // Standard player movement otherwise
                    PlayerSystem.handle(playerId, 'player:moveInput', payload);
                }

                return;
            }

            if (!namespace || !action) {
                console.warn(`Invalid event format: ${eventName}`);
                return; // break early before anything bad happens
            }

            const system = systems[namespace];   // Get the relevant system (player, npc etc)
            if (!system) {
                console.warn(`Invalid namespace: ${eventName}`);
                return;
            }

            // Call system handler
            const outcome = system.handle(socket.id, eventName, payload || {});

            // Send response
            if (outcome && !outcome.result) {
                console.warn(`${eventName}:error`, { reason: outcome.reason })
                //socket.emit(`${eventName}:error`, { reason: result.reason });
            } else if (outcome && outcome.result) {

                
                //emits events to client
                if (eventName === 'player:takeControl') {
                    socket.emit('controlTaken');
                } else if (eventName === 'player:releaseControl') {
                    socket.emit('controlReleased');
                } else if (eventName === 'player:enterShip') {
                    socket.emit('climbedLadder', { shipId: payload.shipId });
                } else if (eventName === 'player:exitShip') {
                    socket.emit('exitedShip', {});
                }
            }
        });
    }
    broadcastConnectedPlayers() {
        // Pull from your game engine registry (player entities)
        const players = [];

        for (const entity of this.gameEngine.EntityRegistry.getPlayers().forEach()) {
            if (entity?.type === "player") {
                players.push({
                    id: entity.id,
                    username: entity.username ?? "Anonymous",
                });
            }
        }

        // Optional: sort alphabetically
        players.sort((a, b) => a.username.localeCompare(b.username));

        this.io.emit("players:list", players);
    }
}