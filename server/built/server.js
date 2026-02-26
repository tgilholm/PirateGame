"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const world_factory_1 = __importDefault(require("./application/world-factory"));
const world_manager_1 = __importDefault(require("./application/world-manager"));
// Create the express app & server
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
// Route files to the public folder
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
const worldFactory = new world_factory_1.default();
const worldManager = new world_manager_1.default(new world_factory_1.default());
