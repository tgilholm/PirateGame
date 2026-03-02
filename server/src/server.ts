
/* 
  Entry point of the server-side Node.JS application.
    Now with TypeScript!
*/

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import SocketService from './application/socket-service';
import { CONFIG } from './config';
import GameWorld from './application/game-world';
import EntityRegistry from './engine/entity-registry';
import EntityFactory from './entities/entity-factory';
import entityConfig from '../../shared/entity-config.json';
import GameEngine from './engine/game-engine';
import PhysicsSystem from './systems/physics-system';
import MovementSystem from './systems/movement-system';
import ProjectileSystem from './systems/projectile-system';
import MessageSystem from './systems/message-system';
import { Engine } from 'matter-js';
import TerrainMap from './engine/terrain-map';
import WorldController from './controllers/world-controller';
import PlayerController from './controllers/player-controller';
import UpgradeHandler from './handlers/upgrade-handler';
import ShipController from './controllers/ship-controller';
import MessageController from './controllers/message-controller';

// Create the express app & server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Route files to the public folder
app.use(express.static(path.join(__dirname, '../../public')));
app.use('/shared', express.static(path.join(__dirname, '../../shared/browser')));


/*
  Create the game world
*/

const registry = new EntityRegistry();
const entityFactory = new EntityFactory(entityConfig);
const matterEngine = Engine.create()
const terrainMap = new TerrainMap('demo-map.json')

const engine = new GameEngine({
  physicsSystem: new PhysicsSystem(registry, matterEngine, terrainMap),
  movementSystem: new MovementSystem(registry, entityConfig, terrainMap),
  projectileSystem: new ProjectileSystem(registry),
  messageSystem: new MessageSystem()
});

const upgradeHandler = new UpgradeHandler(entityConfig);

const worldController = new WorldController(registry,
  {
    playerController: new PlayerController(registry, upgradeHandler),
    shipController: new ShipController(registry),
    messageController: new MessageController()
  }
);

const gameWorld = new GameWorld(registry, entityFactory, engine, worldController);
const socketService = new SocketService(io, gameWorld);

socketService.initialise();
gameWorld.start();

const PORT = process.env.PORT || CONFIG.PORT
server.listen(PORT, () => {
  console.log(`[Server] Server launched on port: ${PORT}`);
});