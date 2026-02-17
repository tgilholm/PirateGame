/* global io */

import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

// ----------------------
// Setup server
// ----------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------
// Game state - single ship
// ----------------------
let ship = {
    x: 1000,
    y: 1000,
    rotation: 0,
    speed: 0,
    maxSpeed: 8,
    drag: 0.95,
    turnSpeed: 0.02,
    acceleration: 0.5
};

let shipInput = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    deckCount: 1
};

// ----------------------
// Socket.IO events
// ----------------------
io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Handle ship input
    socket.on('shipInput', (input) => {
        shipInput = input;
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
    });
});

// ----------------------
// Game loop - 60 FPS
// ----------------------
setInterval(() => {
    // Calculate mass multiplier based on deck count (mass increases with decks)
    const baseMass = 1;
    const mass = baseMass + (shipInput.deckCount - 1) * 0.5; // Each deck adds 0.5 mass
    
    // Acceleration inversely affected by mass (more mass = harder to accelerate)
    const adjustedAcceleration = ship.acceleration / Math.sqrt(mass);
    
    // Drag inversely affected by mass (more mass = more momentum, slower to stop)
    const adjustedDrag = ship.drag + (1 - ship.drag) * (1 - 1 / Math.sqrt(mass));
    
    // Acceleration
    if (shipInput.up) ship.speed = Math.min(ship.speed + adjustedAcceleration, ship.maxSpeed);
    if (shipInput.down) ship.speed = Math.max(ship.speed - adjustedAcceleration, -1);

    // Turning - scale turn speed based on current speed and mass
    if (Math.abs(ship.speed) > 0.01) {
        const speedFraction = Math.abs(ship.speed) / ship.maxSpeed;
        const adjustedTurnSpeed = (ship.turnSpeed * speedFraction) / Math.sqrt(mass);
        if (shipInput.left) ship.rotation -= adjustedTurnSpeed;
        if (shipInput.right) ship.rotation += adjustedTurnSpeed;
    }

    // Movement with mass-affected drag
    if (Math.abs(ship.speed) > 0.01) {
        ship.x += Math.cos(ship.rotation) * ship.speed;
        ship.y += Math.sin(ship.rotation) * ship.speed;

        ship.speed *= adjustedDrag;
        if (Math.abs(ship.speed) < 0.02) ship.speed = 0;
    }

    // Emit updates
    io.emit('shipUpdate', ship);

    // Emit shooting
    if (shipInput.shoot) {
        io.emit('shipShoot', ship);
        shipInput.shoot = false; // reset shoot
    }
}, 1000 / 60);

// ----------------------
// Start server
// ----------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
