/* global io */

import Player from "./objects/player.js";
import Ship from "./objects/ship.js";

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d80c9',
    parent: 'game-container',

    physics: {
        default: 'matter',  // for complex physics
        matter: {
            gravity: { x: 0, y: 0 },
            debug: true
        }
    },

    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let socket;
let keys, shipKeys;

let ships = {};
let players = {};

function preload() {
    // Load the tilesheet
    this.load.image("tiles", "/assets/terrain-tilesheet.png");

    // Load the map
    this.load.tilemapTiledJSON("map", "/assets/demo-map.json");
}


function create() {

    const cameras = this.cameras.main;
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("terrain-tilesheet", "tiles");

    // Add the tileset layers
    const sea = map.createLayer("sea", tileset, 0, 0); // Add at 0, 0
    const shallows = map.createLayer("shallows", tileset, 0, 0);
    const islands = map.createLayer("islands", tileset, 0, 0);

    this.matter.world.convertTilemapLayer(islands);

    // @ts-ignore
    socket = io();
    keys = this.input.keyboard.addKeys("W, A, S, D");
    shipKeys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        up: Phaser.Input.Keyboard.KeyCodes.UP
    })

    socket.on('gameState', (data) => {

        // Update the ships
        data.ships.forEach(shipData => {
            if (!ships[shipData.id]) {  // only create if it doesn't already exist
                ships[shipData.id] = new Ship(this, shipData.x, shipData.y);
            }

            // Update with server data
            ships[shipData.id].target = { x: shipData.x, y: shipData.y, r: shipData.r };
        });

        // Update the players
        data.players.forEach(playerData => {
            if (!players[playerData.id]) {
                players[playerData.id] = new Player(this, playerData.id);   // only create if it doesn't exist
            }

            // Link the player to their ship parent
            const shipParent = ships[playerData.parentId];
            players[playerData.id].updateState(playerData, shipParent);

            // If current player, follow with the camera
            if (playerData.id === socket.id && shipParent) {
                this.cameras.main.startFollow(shipParent.container, true, 0.1, 0.1);
            }
        });
    })
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);   // don't leave the map
}

function update() {
    // Interpolate all objects 
    Object.values(ships).forEach(ship => ship.update());
    Object.values(players).forEach(player => player.update());

    // Player movement
    socket.emit('playerInput', {
        w: keys.W.isDown,
        a: keys.A.isDown,
        s: keys.S.isDown,
        d: keys.D.isDown
    });

    // Ship movement
    socket.emit('shipInput', {
        up: shipKeys.up.isDown,
        left: shipKeys.left.isDown,
        right: shipKeys.right.isDown
    });
}