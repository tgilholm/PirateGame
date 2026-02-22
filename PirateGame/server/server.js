/* global io */

import express from "express";
import http from "http";
import path from "path";
import { initConfig, INIT_CONFIG } from './config.js';
import { SERVER_CONFIG } from "./server-config.js";
import shipStatsRouter from './shipStats.js';

// @ts-ignore
import { Server } from "socket.io"
import { fileURLToPath } from "url";
import EntityRegistry from "./engine/entity-registry.js";
import GameEngine from "./engine/game-engine.js";
import SocketHandler from "./handlers/socket-handler.js";

// Create the server
const app = express();

app.use('/api', shipStatsRouter); //adds rout for ship stats


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });


/*
    Directs incoming users to the correct directory for static content.
*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..'); // go up a directory
const publicDir = path.join(rootDir, 'public'); // append "public";

// Serve static content from the public directory
app.use(express.static(publicDir));

// Send to the index.html landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});


/*
    Architectural abstractions for the key areas of the server-side code.
    EntityRegistry follows a repository pattern; it keeps track of all entities
    GameEngine abstracts the real-time game simulation.
    SocketHandler handles incoming and outgoing socket events from clients.
*/
const gameEngine = new GameEngine();
const socketHandler = new SocketHandler(io, gameEngine);
EntityRegistry.initialise();

// Initialize configuration and create ships after stats are loaded
await initConfig();

// Create an example ship for testing

gameEngine.createShip("ship_1", INIT_CONFIG.SPAWN.SHIP.X, INIT_CONFIG.SPAWN.SHIP.Y);

// Create 10 ships for testing
for (let i = 0; i < 10; i++) {
    gameEngine.createShip(`ship_${i + 1}`, 1000 + i * 200, 1000 + i * 200);
}



/*
    New connections- when a player first loads the webpage, the "connection"
    event is fired, and the socket object contains a unique ID pertaining
    to the player who just connected.

    This block can be thought of as "setting up" for a new player.
*/
io.on("connection", (socket) => {
    console.log(`[Socket] Player Connected: ${socket.id}`);
    socketHandler.handleConnect(socket);

    // Fires when a player leaves the game
    socket.on('disconnect', () => {
        console.log(`[Socket] Player Disconnected: ${socket.id}`);
        socketHandler.handleDisconnect(socket);
    });
});

/*
    The server's internal model of the game state, updated at the specified tick rate.
*/
setInterval(() => {
    gameEngine.update();    // Update the internal model of the game
}, 1000 / SERVER_CONFIG.TICK_RATE);

/*
    Network loop- broadcast the current state of the game at the network tick rate to all listeners
*/
setInterval(() => {
    const updates = gameEngine.getRecentUpdates();
    if (updates.ships.length > 0 || updates.players.length > 0) {   // Only send state if someone's connected!
        io.volatile.emit('gameState', updates);
    }

    //console.log(updates);

}, 1000 / SERVER_CONFIG.NET_TICK_RATE);


/*
    Debug loop- output the state of the game every 30 seconds with the ships and players
*/
setInterval(() => {
    const stats = EntityRegistry.getStats();
    console.debug(`[Server] Total Entities: ${stats.totalEntities} Ships: ${stats.byType.ship}, Players: ${stats.byType.player}`);
    //console.debug(EntityRegistry.getAllEntities());
}, 10000);


const PORT = process.env.PORT || SERVER_CONFIG.PORT;   // Set default port as fallback
server.listen(PORT, () => { // Open on the specified port and listen for traffic
    console.log(`[Server] launched on port: ${PORT}`);
});