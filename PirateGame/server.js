/* global io */

import Matter from "matter-js";
import express from "express";
import http from "http";
import path from "path";
import fs from 'fs';    // for reading files
// @ts-ignore
import { Server } from "socket.io"
import { fileURLToPath } from "url";

// aliases for matter modules
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

// Create matter engine
const engine = Engine.create({ gravity: { x: 0, y: 0 } });
const world = engine.world;

// Read the tilemap & generate collision objects for each tile where "collides" = true
const mapData = JSON.parse(fs.readFileSync('./public/assets/demo-map.json', 'utf-8'));
const tileWidth = mapData.tilewidth;
const mapWidth = mapData.width;

const islands = mapData.layers.find(layer => layer.name === "islands");

// create colliders for each solid object
if (islands && islands.data) {
    let tileArray;

    if (typeof islands.data === 'string') {
        // Decode Base64 string to a Buffer then to a Uint32Array
        const buffer = Buffer.from(islands.data, 'base64');
        tileArray = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
    } else {
        tileArray = islands.data;
    }

    tileArray.forEach((tileGid, index) => {
        if (tileGid !== 0) {
            const x = (index % mapWidth) * tileWidth + (tileWidth / 2);
            const y = Math.floor(index / mapWidth) * tileWidth + (tileWidth / 2);

            const part = Bodies.rectangle(x, y, tileWidth, tileWidth, { isStatic: true });
            World.add(world, part);
        }
    });
}



// Create the server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const TICK_RATE = 60;
const NET_TICK_RATE = 60;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Send new connections the index.html landing page
app.use(express.static(path.join(__dirname, 'public')));

// Array containing the ships in the game
const ships = {
    "ship_1": {     // test ship
        id: "ship_1",
        body: Bodies.rectangle(300, 200, 200, 120, {
            frictionAir: 0.05,
            mass: 150
        }), // x= 300, y = 400, 200 wide, 120 tall

        turnSpeed: 0.0003,
        thrust: 0.15,
        inputs: { up: false, down: false, left: false, right: false }   // arrow keys for ships
    }
};

let players = {};

// Add demo ship to the world
World.add(world, ships["ship_1"].body);



// Dispatch events to clients on specific events- moving, joining game etc
io.on("connection", (socket) => {
    console.log(`Player Connected: ${socket.id}`);

    // init player
    players[socket.id] = {
        id: socket.id,
        username: "",
        x: 0,
        y: 0,
        parentId: "ship_1",
        speed: 3,
        inputs: { w: false, a: false, s: false, d: false }   // wasd for players
    }

    const shipsForClient = {};
    Object.keys(ships).forEach(id => {
        shipsForClient[id] = {
            id: ships[id].id,
            x: ships[id].body.position.x,
            y: ships[id].body.position.y,
            rotation: ships[id].body.angle
        };
    });

    // Update player with current game state after joining
    socket.emit('initGame', { shipsForClient, players }); // send only to this player

    // Set the player's name by their socket id
    socket.on('nameSet', (inputData) => {
        if (players[inputData.id]) {

            const newUsername = inputData.username;

            // Check if the name exceeds 16 chars
            if (newUsername.length > 16) {
                const trimmedUsername = newUsername.substring(0, 16);

                // Save the username up until index 16
                players[inputData.id].username = trimmedUsername

                console.debug(`Invalid username ${newUsername}, trimming to ${trimmedUsername}`);
            } else {
                players[inputData.id].username = inputData.username
            }
        }
    })

    // Handle players movement
    socket.on('playerInput', (inputData) => {
        if (players[socket.id]) {
            players[socket.id].inputs = inputData;
        }
    })

    // Handle ships movement
    socket.on('shipInput', (inputData) => { // update to send ship id with packet
        if (ships["ship_1"]) {
            ships["ship_1"].inputs = inputData;
        }
    })

    // Handle disconnects
    socket.on('disconnect', () => {
        console.log(`Player Disconnected: ${socket.id}`);
        delete players[socket.id];
    })
})


setInterval(() => {
    // Update ships
    Object.values(ships).forEach(ship => {
        updateShipPhysics(ship);
    });


    // Update players
    Object.values(players).forEach(player => {
        updatePlayerPhysics(player);
    });

    Engine.update(engine, 1000 / TICK_RATE);
}, 1000 / TICK_RATE);

setInterval(() => {
    io.volatile.emit('gameState', {
        // Don't send all the data, just what's important
        ships: Object.values(ships).map(s => ({
            id: s.id,
            x: s.body.position.x,
            y: s.body.position.y,
            r: s.body.angle
        })),

        players: Object.values(players).map(p => ({
            id: p.id,
            parentId: p.parentId,
            x: p.x,
            y: p.y,
            username: p.username
        }))
    });
}, 1000 / NET_TICK_RATE);


// Handle physics server-side
function updateShipPhysics(ship) {

    const { up, down, left, right } = ship.inputs;
    const body = ship.body;

    // Handle turning
    if (left) Body.setAngularVelocity(body, -ship.turnSpeed * 20);
    if (right) Body.setAngularVelocity(body, ship.turnSpeed * 20);

    // Handle thrust
    if (up) {
        const force = {
            x: Math.cos(body.angle) * ship.thrust,
            y: Math.sin(body.angle) * ship.thrust
        }

        // Apply the force
        Body.applyForce(body, body.position, force);
    }

    //console.log(body.position)
}

function updatePlayerPhysics(player) {
    const ship = ships[player.parentId];
    const shipWidth = 300;
    const shipHeight = 160;


    // If the player is on the ship, keep them inside it
    if (ship) {
        const sx = ship.body.position.x;
        const sy = ship.body.position.y;
        const r = ship.body.angle;

        // world position of the player
        let worldPos = localToWorld(sx, sy, r, player.x, player.y);

        // apply input in world space
        if (player.inputs.w) worldPos.y -= player.speed;
        if (player.inputs.s) worldPos.y += player.speed;
        if (player.inputs.a) worldPos.x -= player.speed;
        if (player.inputs.d) worldPos.x += player.speed;

        // convert back to local space
        const newLocal = worldToLocal(sx, sy, r, worldPos.x, worldPos.y);

        // bind the player inside the ship
        const playerRadius = 10;
        const maxX = (shipWidth / 2) - playerRadius;    // player cannot leave the "box"
        const maxY = (shipHeight / 2) - playerRadius

        // if the player ends up outside the box, put them back inside
        if (newLocal.x > maxX) newLocal.x = maxX;
        if (newLocal.x < -maxX) newLocal.x = -maxX;

        if (newLocal.y > maxY) newLocal.y = maxY;
        if (newLocal.y < -maxY) newLocal.y = -maxY;

        // player is still on the ship
        player.x = newLocal.x;
        player.y = newLocal.y;

        // player is in world space – move freely
    } else {
        if (player.inputs.w) player.y -= player.speed;
        if (player.inputs.s) player.y += player.speed;
        if (player.inputs.a) player.x -= player.speed;
        if (player.inputs.d) player.x += player.speed;

        // check if player is near any ship and re-parent if so
        for (const shipId in ships) {
            const ship = ships[shipId];
            const sx = ship.body.position.x;
            const sy = ship.body.position.y;

            const dx = player.x - sx;
            const dy = player.y - sy;

            if (Math.abs(dx) < shipWidth / 2 && Math.abs(dy) < shipHeight / 2) {
                // player entered a ship's bounding box – re-parent them
                player.parentId = shipId;
                const r = ship.body.angle;
                const local = worldToLocal(sx, sy, r, player.x, player.y);
                player.x = local.x;
                player.y = local.y;
                break;
            }
        }
    }
}

const PORT = process.env.PORT || 3000;  // set port to 3000
server.listen(PORT, () => {
    console.log(`Server launched on port ${PORT}`);
});


function localToWorld(parentX, parentY, parentRotation, localX, localY) {
    const cos = Math.cos(parentRotation);
    const sin = Math.sin(parentRotation);

    const rotatedX = localX * cos - localY * sin;
    const rotatedY = localX * sin + localY * cos;

    return {
        x: parentX + rotatedX,
        y: parentY + rotatedY
    };
}

function worldToLocal(parentX, parentY, parentRotation, worldX, worldY) {
    const dx = worldX - parentX;
    const dy = worldY - parentY;
    const cos = Math.cos(-parentRotation);
    const sin = Math.sin(-parentRotation);

    return {
        x: dx * cos - dy * sin,
        y: dx * sin + dy * cos
    };
}