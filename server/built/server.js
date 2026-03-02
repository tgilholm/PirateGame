"use strict";
/*
  Entry point of the server-side Node.JS application.
    Now with TypeScript!
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const socket_service_1 = __importDefault(require("./application/socket-service"));
const config_1 = require("./config");
const game_world_1 = __importDefault(require("./application/game-world"));
const entity_registry_1 = __importDefault(require("./engine/entity-registry"));
const entity_factory_1 = __importDefault(require("./entities/entity-factory"));
const entity_config_json_1 = __importDefault(require("../../shared/entity-config.json"));
const game_engine_1 = __importDefault(require("./engine/game-engine"));
const physics_system_1 = __importDefault(require("./systems/physics-system"));
const movement_system_1 = __importDefault(require("./systems/movement-system"));
const projectile_system_1 = __importDefault(require("./systems/projectile-system"));
const message_system_1 = __importDefault(require("./systems/message-system"));
const matter_js_1 = require("matter-js");
const terrain_map_1 = __importDefault(require("./engine/terrain-map"));
const world_controller_1 = __importDefault(require("./controllers/world-controller"));
const player_controller_1 = __importDefault(require("./controllers/player-controller"));
const upgrade_handler_1 = __importDefault(require("./handlers/upgrade-handler"));
const ship_controller_1 = __importDefault(require("./controllers/ship-controller"));
const message_controller_1 = __importDefault(require("./controllers/message-controller"));
// Create the express app & server
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
// Route files to the public folder
app.use(express_1.default.static(path_1.default.join(__dirname, '../../public')));
app.use('/shared', express_1.default.static(path_1.default.join(__dirname, '../../shared/built')));
/*
  Create the game world
*/
const registry = new entity_registry_1.default();
const entityFactory = new entity_factory_1.default(entity_config_json_1.default);
const matterEngine = matter_js_1.Engine.create();
const terrainMap = new terrain_map_1.default('demo-map.json');
const engine = new game_engine_1.default({
    physicsSystem: new physics_system_1.default(registry, matterEngine, terrainMap),
    movementSystem: new movement_system_1.default(registry, entity_config_json_1.default, terrainMap),
    projectileSystem: new projectile_system_1.default(registry),
    messageSystem: new message_system_1.default()
});
const upgradeHandler = new upgrade_handler_1.default(entity_config_json_1.default);
const worldController = new world_controller_1.default(registry, {
    playerController: new player_controller_1.default(registry, upgradeHandler),
    shipController: new ship_controller_1.default(registry),
    messageController: new message_controller_1.default()
});
const gameWorld = new game_world_1.default(registry, entityFactory, engine, worldController);
const socketService = new socket_service_1.default(io, gameWorld);
socketService.initialise();
gameWorld.start();
const PORT = process.env.PORT || config_1.CONFIG.PORT;
server.listen(PORT, () => {
    console.log(`[Server] Server launched on port: ${PORT}`);
});
