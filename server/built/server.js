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
const world_manager_1 = __importDefault(require("./application/world-manager"));
const socket_service_1 = __importDefault(require("./application/socket-service"));
const config_1 = require("./config");
const entity_config_json_1 = __importDefault(require("./entity-config.json"));
const world_1 = require("./engine/world");
// Create the express app & server
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
// Route files to the public folder
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Composition root- create all dependencies and inject
const worldManager = new world_manager_1.default(entity_config_json_1.default);
const socketService = new socket_service_1.default(io, worldManager);
socketService.initialise();
/*
Start with two worlds initially- WorldManager can dynamically expand the map
with new worlds when they fill up
*/
worldManager.createWorld({
    maxPlayers: 32,
    mode: world_1.GameMode.FREE_FOR_ALL
});
// worldManager.createWorld({
//   maxPlayers: 32,
//   mode: GameMode.TEAMS
// });
/*
  Player is presented with the choice of free-for-all or teams- socketService
  accepts their choice and uses WorldManager to route to the correct world.

  If the world is "full", a new one is started and the players are re-distributed
  between the new worlds.
*/
const PORT = process.env.PORT || config_1.CONFIG.PORT;
server.listen(PORT, () => {
    console.log(`[Server] Server launched on port: ${PORT}`);
});
