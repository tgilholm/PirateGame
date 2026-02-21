import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import WorldFactory from './application/world-factory';
import WorldManager from './application/world-manager';

// Create the express app & server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Route files to the public folder
app.use(express.static(path.join(__dirname, 'public')));


// Composition root- create all dependencies and inject
const worldFactory = new WorldFactory();
const worldManager = new WorldManager(worldFactory);