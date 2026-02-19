/* global io */

import Matter from "matter-js";
import express from "express";
import http from "http";
import path from "path";
import fs from 'fs';    // for reading files
import { CONFIG } from './config.js';

// @ts-ignore
import { Server } from "socket.io"
import { fileURLToPath } from "url";
import ServerShip from "./server-ship.js";

// Create the server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const TICK_RATE = CONFIG.TICK_RATE;
const NET_TICK_RATE = CONFIG.NET_TICK_RATE;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..'); // go up a directory
const publicDir = path.join(rootDir, 'public'); // append "public";


// Server static content from the public directory
app.use(express.static(publicDir));

// Send to the index.html landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// aliases for matter modules
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

// Create matter engine
const engine = Engine.create({ gravity: { x: 0, y: 0 } });
const world = engine.world;


// Read the tilemap & generate collision objects for each tile where "collides" = true
const mapPath = path.join(rootDir, 'public', 'assets', 'demo-map.json');
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
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

// Array containing the ships in the game
const ships = {
    "ship_1": new ServerShip("ship_1", 2500, 5000)
};

const players = {}; // Array containing players

// Add all the ships to the world
Object.keys(ships).forEach(id => {
    const ship = ships[id];

    if (ship.body) {
        World.add(world, ship.body);
    }
});

// Dispatch events to clients on specific events- moving, joining game etc
io.on("connection", (socket) => {
    console.log(`Player Connected: ${socket.id}`);

    // Collect current ship states
    const shipData = {};
    for (const id in ships) {
        shipData[id] = {
            x: ships[id].body.position.x,
            y: ships[id].body.position.y,
            r: ships[id].body.angle,
            params: ships[id].getParams()
        };
    }

    // Add the player to the list
    players[socket.id] = {
        id: socket.id,
        username: "",
        x: 0,   // relative to parent
        y: 0,
        parentId: "ship_1", // initially parented to the test ship
        speed: 3,
        inputs: { w: false, a: false, s: false, d: false }   // wasd for players
    }

    // Event received from client when the player has fully loaded in
    socket.on('playerReady', (data) => {
        // Sanitise username
        const newUsername = String(data.username)
            .trim()
            .substring(0, 16)
            .replace(/[<>]/g, '');   // remove illegal characters

        players[socket.id].username = data.username

        // Send initialization package only when client is ready
        socket.emit('initGame', {
            shipData,
            players: Object.values(players) // existing players
        });

        console.log(`Sent initGame to ${socket.id}`);
    });


    // Handle players movement
    socket.on('playerInput', (inputData) => {
        if (!players[socket.id]) return;    // if player doesn't exist, break early

        players[socket.id].inputs = inputData;
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

/*
    Server-side physics simulation. Executed at the same speed as the clients,
    but updates are only posted back at 1/3 the rate.
*/
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


const lastBroadcast = {
    ships: {},
    players: {}
};

/*
    Periodically refresh the clients with the current game state. Keeping track of
    lastBroadcast means that the positions of ships need only be updated if they have been
    changed recently, improving performance for stationary ships
*/
setInterval(() => {
    const shipUpdates = [];

    Object.values(ships).forEach(s => {
        const current = {
            id: s.id,
            x: s.body.position.x,
            y: s.body.position.y,
            r: s.body.angle,
            vx: s.body.velocity.x,
            vy: s.body.velocity.y,
            av: s.body.angularVelocity
        };

        const last = lastBroadcast.ships[s.id];

        // Only send if position changed significantly
        if (!last ||
            Math.abs(current.x - last.x) > 1 ||
            Math.abs(current.y - last.y) > 1 ||
            Math.abs(current.r - last.r) > 0.05) {

            lastBroadcast.ships[s.id] = current;
            shipUpdates.push(current);
        }
    });

    const playerUpdates = [];

    Object.values(players).forEach(p => {
        const current = {
            id: p.id,
            parentId: p.parentId,
            x: p.x,
            y: p.y,
            username: p.username
        };

        const last = lastBroadcast.players[p.id];

        // Only send if changed
        if (!last ||
            current.parentId !== last.parentId ||
            Math.abs(current.x - last.x) > 1 ||
            Math.abs(current.y - last.y) > 1) {

            lastBroadcast.players[p.id] = current;
            playerUpdates.push(current);
        }
    });

    // Only broadcast if there are changes
    if (shipUpdates.length > 0 || playerUpdates.length > 0) {
        io.volatile.emit('gameState', {
            ships: shipUpdates,
            players: playerUpdates
        });
    }
}, 1000 / NET_TICK_RATE);


/**
 * Updates the local (server-side) simulation of a ServerShip object.
 * Applies the user inputs received from events.
 *
 * @param {ServerShip} ship the ship to simulate
 */
function updateShipPhysics(ship) {

    const { up, down, left, right } = ship.inputs;
    const body = ship.body;


    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2); //finds speed of ship using pythagorean theorem, mrs Yates was right, it is useful i guess

    // Handle turning - only if ship is moving
    if (speed > 0.2) {
        //scales turning speed with movement speed
        const turnSpeedMultiplier = speed * 0.5;
        const effectiveTurnSpeed = ship.turnSpeed * 20 * turnSpeedMultiplier;

        if (left) Body.setAngularVelocity(body, -effectiveTurnSpeed);
        if (right) Body.setAngularVelocity(body, effectiveTurnSpeed);
    }

    // Handle thrust
    if (up) {
        const force = {
            x: Math.cos(body.angle) * ship.thrust,
            y: Math.sin(body.angle) * ship.thrust
        }

        // Apply the force
        Body.applyForce(body, body.position, force);
    }
}

/**
 * 
 * @param {any} player 
 */
function updatePlayerPhysics(player) {
    const ship = ships[player.parentId];


    // If the player is on the ship, keep them inside it and move with the ship
    if (ship) {
        const shipX = ship.body.position.x;
        const shipY = ship.body.position.y;
        const r = ship.body.angle;

        // world position of the player
        let worldPos = localToWorld(shipX, shipY, r, player.x, player.y);
        if (player.inputs.w) worldPos.y -= player.speed;
        if (player.inputs.s) worldPos.y += player.speed;
        if (player.inputs.a) worldPos.x -= player.speed;
        if (player.inputs.d) worldPos.x += player.speed;

        // convert to local space
        const newLocal = worldToLocal(shipX, shipY, r, worldPos.x, worldPos.y);

        // collision check
        const playerRadius = CONFIG.PLAYER.RADIUS;
        if (ship.isInside(newLocal.x, newLocal.y, playerRadius)) {
            player.x = newLocal.x;
            player.y = newLocal.y;
        } else {
            if (ship.isInside(newLocal.x, player.y, playerRadius)) {
                player.x = newLocal.x;
            } else if (ship.isInside(player.x, newLocal.y, playerRadius)) {
                player.y = newLocal.y;
            }
        }


    } else { // player is in world space – move freely
        if (player.inputs.w) player.y -= player.speed;
        if (player.inputs.s) player.y += player.speed;
        if (player.inputs.a) player.x -= player.speed;
        if (player.inputs.d) player.x += player.speed;
    }
    // check if player is near any ship and re-parent if so
    // for (const shipId in ships) {
    //     const ship = ships[shipId];
    //     const sx = ship.body.position.x;
    //     const sy = ship.body.position.y;

    //     const dx = player.x - sx;
    //     const dy = player.y - sy;

    //     if (Math.abs(dx) < shipWidth / 2 && Math.abs(dy) < shipHeight / 2) {
    //         // player entered a ship's bounding box – re-parent them
    //         player.parentId = shipId;
    //         const r = ship.body.angle;
    //         const local = worldToLocal(sx, sy, r, player.x, player.y);
    //         player.x = local.x;
    //         player.y = local.y;
    //         break;
    //     }
    // }
}


const PORT = process.env.PORT || CONFIG.PORT;
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
