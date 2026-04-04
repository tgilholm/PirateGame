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
import StatsHandler from './handlers/stats-handler';
import ShipController from './controllers/ship-controller';
import MessageController from './controllers/message-controller';
import InteractionHandler from './handlers/interaction-handler';
import SpatialGrid from './application/spatial-grid';
import CannonController from './controllers/cannon-controller';
import NPCSystem from './systems/npc-system';
import GoldHandler from './handlers/gold-handler';
import { ServerEvent } from '@shared/socket-protocol';
import TreasureSystem from './systems/treasure-system';
import SpawnSystem from './systems/spawn-system';
import SessionHandler from './handlers/session-handler';

// Create the express app & server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Route files to the public folder
app.use(express.static(path.join(__dirname, '../../public')));
app.use('/shared', express.static(path.join(__dirname, '../../shared/browser')));
app.use('/jsons', express.static(path.join(__dirname, '../jsons')));

/*
  Create the game world. This file acts as the composition root- the start of the dependency
  tree. All dependencies must be created and injected here.
*/
const registry = new EntityRegistry();
const matterEngine = Engine.create({
	gravity: { x: 0, y: 0 },
});
const spatialGrid = new SpatialGrid(512, 2048);

const terrainMap = new TerrainMap('demo-map.json');
const physicsSystem = new PhysicsSystem(registry, matterEngine, terrainMap);
const projectileSystem = new ProjectileSystem(registry, spatialGrid, terrainMap);
const entityFactory = new EntityFactory(entityConfig, registry);
const treasureSystem = new TreasureSystem(registry, entityFactory, terrainMap, entityConfig);
const spawnSystem = new SpawnSystem(terrainMap);

const engine = new GameEngine({
	physicsSystem,
	movementSystem: new MovementSystem(registry, entityConfig, terrainMap),
	spawnSystem,
	projectileSystem,
	messageSystem: new MessageSystem(),
	npcSystem: new NPCSystem(terrainMap, entityFactory, registry, spatialGrid),
	treasureSystem,
});

const upgradeHandler = new UpgradeHandler(new GoldHandler(), new StatsHandler());
const interactionHandler = new InteractionHandler();
const sessionHandler = new SessionHandler(registry, entityFactory, engine, spatialGrid);

const worldController = new WorldController(registry, sessionHandler, {
	playerController: new PlayerController(registry, interactionHandler, upgradeHandler, treasureSystem, spawnSystem),
	shipController: new ShipController(registry),
	messageController: new MessageController(),
	cannonController: new CannonController(registry),
});

const gameWorld = new GameWorld(
	registry,
	entityFactory,
	engine,
	worldController,
	spatialGrid,
	terrainMap,
	sessionHandler
);
const socketService = new SocketService(io, gameWorld);

socketService.initialise();

treasureSystem.bindUiEvents(
	(playerId, payload) => {
		io.to(playerId).emit(ServerEvent.DIG_MINIGAME_START, payload);
	},
	(playerId, payload) => {
		io.to(playerId).emit(ServerEvent.DIG_MINIGAME_RESULT, payload);
	}
);

gameWorld.start();

// Starts the server on the provided port
const PORT = process.env.PORT || CONFIG.PORT;
server.listen(PORT, () => {
	console.log(`[Server] Server launched on port: ${PORT}`);
});
