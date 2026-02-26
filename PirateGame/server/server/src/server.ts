
/* 
  Entry point of the server-side Node.JS application.
    Now with TypeScript!
*/

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import WorldFactory from './application/world-factory';
import WorldManager from './application/world-manager';
import SocketService from './application/socket-service';
import { CONFIG } from './config';
import entityConfig from './entity-config.json';

// Create the express app & server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Route files to the public folder
app.use(express.static(path.join(__dirname, 'public')));


// Composition root- create all dependencies and inject
const worldManager = new WorldManager(entityConfig);
const socketService = new SocketService(io, worldManager);
socketService.initialise();

/*
Start with two worlds initially- WorldManager can dynamically expand the map
with new worlds when they fill up
*/
worldManager.createWorld({
  maxPlayers: 32,
  mode: GameMode.FREE_FOR_ALL
});

worldManager.createWorld({
  maxPlayers: 32,
  mode: GameMode.TEAMS
});

/*
  Player is presented with the choice of free-for-all or teams- socketService
  accepts their choice and uses WorldManager to route to the correct world.

  If the world is "full", a new one is started and the players are re-distributed
  between the new worlds.
*/

const PORT = process.env.PORT || CONFIG.PORT
server.listen(PORT, () => {
  console.log(`[Server] Server launched on port: ${PORT}`);
});