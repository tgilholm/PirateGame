/* global io */

import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io"
import { fileURLToPath } from "url";

// Create the server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Send new connections the index.html landing page
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let players = {};

let ship = {
    x: 1000,
    y: 1000,
    rotation: 0,        // angle in radians of the shio
    speed: 0,           // forward momentum

    // physics constants
    maxSpeed: 4,
    drag: 0.99,         // multiplier for speed- higher value = lower drag
    turnSpeed: 0.02,
    acceleration: 0.05
};

// Dispatch events to clients on specific events- moving, joining game etc
io.on("connection", (socket) => {

    // Handle the ship movement
    socket.on('shipInput', (input) => {
        //if (ship.driverId === socket.id) {   // only allow movement if player is at the helm
        if (input.up) ship.speed = Math.min(ship.speed + ship.acceleration, ship.maxSpeed);     // capped at maximum speed
        if (input.down) ship.speed = Math.max(ship.speed - ship.acceleration, -1);              // capped at -1 (maximum backwards velocity)

        // Ships can only turn while moving (duh)
        if (Math.abs(ship.speed) > 0.01) {
            if (input.left) ship.rotation -= ship.turnSpeed;    // add or subtract turnSpeed constant to rotation
            if (input.right) ship.rotation += ship.turnSpeed;
        }

    });
})

// Every tick, 
setInterval(() => {
    if (Math.abs(ship.speed) > 0.01)    // get absolute speed
    {
        // some lovely trigonometry
        ship.x += Math.cos(ship.rotation) * ship.speed; // increment x by cosine of rotation * speed
        ship.y += Math.sin(ship.rotation) * ship.speed; // increment y by sine of rotation * speed

        ship.speed *= ship.drag;    // if drag is 0.99, reduces speed to 99% of current every tick

        console.log(`x: ${ship.x}, y: ${ship.y}, speed: ${ship.speed}, rot: ${ship.rotation}`)

        // send the new ship pos to clients
        io.volatile.emit('shipUpdate', {
            x: ship.x,
            y: ship.y,
            rotation: ship.rotation
        }
        );
    }
}, 1000 / 60);    // loops 45 times/second and hopefully doesn't explode the server

const PORT = process.env.PORT || 3000;  // set port to 3000
server.listen(PORT, () => {
    console.log(`Server launched on port ${PORT}`);
});
