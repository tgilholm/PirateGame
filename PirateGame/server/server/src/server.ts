
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


// Define world configuration
const worldConfig = {
  maxPlayers: 32
}


// Composition root- create all dependencies and inject
const worldManager = new WorldManager(entityConfig, worldConfig);
const socketService = new SocketService(io, worldManager);
socketService.initialise();

const PORT = process.env.PORT || CONFIG.PORT
server.listen(PORT, () => {
  console.log(`[Server] Server launched on port: ${PORT}`);
});