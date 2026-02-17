/* global Phaser, io */

import Player from "./objects/player.js";
import Ship from "./objects/ship.js";
import { StartScene } from "./start-scene.js";


const ships = {}
const players = {}
const socket = globalThis.io();

/**
 * The "Main Class" for the game. Contains client-side image loading and
 * socket events including user input. Note that content inside these files
 * is accessible to users- avoid placing "server side" logic here.
 * 
 * For instance, players' locations can be stored locally inside the main scene,
 * but the server is the Single Source of Truth and has the final say on the
 * players' actual locations.
 */
class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');

        this.keys = null;
        this.shipKeys = null;
        this.ui = null;
        this.cameraTarget = null;
    }


    /**
     * Loads static assets from the filesystem into memory.
     */
    preload() {
        // Load the tilesheet
        this.load.image("tiles", "/assets/terrain-tilesheet.png");

        // Load the map
        this.load.tilemapTiledJSON("map", "/assets/demo-map.json");
    }

    /**
     * Executed once at runtime- set up all game objects here, such
     * as setting up user input and socket listeners.
     */
    create() {
        // Cameras
        this.cameraTarget = this.add.container(0, 0); // follow the player
        this.cameras.main.startFollow(this.cameraTarget, true, 0.1, 0.1);

        // Generate the tilemap from the .json
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("terrain-tilesheet", "tiles");

        map.createLayer("sea", tileset, 0, 0); // Add at 0, 0
        map.createLayer("shallows", tileset, 0, 0);
        const islands = map.createLayer("islands", tileset, 0, 0);

        this.matter.world.convertTilemapLayer(islands); // add collision to solid objects

        // Keyboard input
        this.keys = /** @type {any} */ (this.input.keyboard.addKeys("W, A, S, D"));
        this.shipKeys = /** @type {any} */ (this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            up: Phaser.Input.Keyboard.KeyCodes.UP
        }));

        /*
            Starts a listener on gameState- Whenever the server sends out a "tick"
            with the current state of the game, update all data.
        */
        socket.on('gameState', (data) => {

            // Update ship list
            data.ships.forEach(shipData => {
                if (!ships[shipData.id]) {  // only create if it doesn't already exist
                    ships[shipData.id] = new Ship(this, shipData.x, shipData.y);
                }

                // Update with server data
                ships[shipData.id].target = { x: shipData.x, y: shipData.y, r: shipData.r };
            });

            // Update player list
            data.players.forEach(playerData => {
                if (!players[playerData.id]) {
                    players[playerData.id] = new Player(this, playerData.id);   // only create if it doesn't exist
                }

                // Assign the parent id, or null if no parent
                const shipParent = ships[playerData.parentId];
                players[playerData.id].updateState(playerData, shipParent);
            });
        })
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);   // don't leave the map
    }


    /**
     * Updates dynamic content such as ships, players, etc
     */
    update() {
        const cameraTarget = this.cameraTarget;

        // Interpolate all objects 
        Object.values(ships).forEach(ship => ship.update());
        Object.values(players).forEach(player => player.update());

        if (players[socket.id]) {
            const player = players[socket.id];
            const parentId = player.parentId;

            // Handle camera movement for players in either relative or absolute state
            if (parentId && ships[parentId]) {
                // Player is on a ship – convert local to world
                const ship = ships[parentId];
                const shipContainer = ship.container;
                const worldPos = Phaser.Math.RotateAround(
                    { x: player.sprite.x, y: player.sprite.y },
                    0, 0,
                    shipContainer.rotation
                );
                // Player is in relative space
                cameraTarget.x = shipContainer.x + worldPos.x;
                cameraTarget.y = shipContainer.y + worldPos.y;
            } else {
                // Player is in world space
                cameraTarget.x = player.sprite.x;
                cameraTarget.y = player.sprite.y;
            }
        }

        // Player movement
        socket.emit('playerInput', {
            w: this.keys.W.isDown,
            a: this.keys.A.isDown,
            s: this.keys.S.isDown,
            d: this.keys.D.isDown
        });

        socket.emit('shipInput', {
            up: this.shipKeys.up.isDown,
            left: this.shipKeys.left.isDown,
            right: this.shipKeys.right.isDown
        });

    }
}

// Set up game 
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d80c9',
    parent: 'game-container',
    scene: [StartScene, MainScene],     // Add all scenes in

    physics: {
        default: 'matter',  // for complex physics
        matter: {
            gravity: { x: 0, y: 0 },
            debug: true
        }
    },
};

const game = new Phaser.Game(config);