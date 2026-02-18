/* global Phaser, io */

import Player from "../objects/player.js";
import Ship from "../objects/ship.js";


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
export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');

        this.keys = null;
        this.shipKeys = null;
        this.ui = null;
        this.cameraTarget = null;
        this.shipParams = null; // retrieve ship width/height etc from server
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
    create(data) {
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(1000); // Always on top

        // Cameras
        this.cameraTarget = this.add.container(0, 0); // follow the player
        this.cameras.main.startFollow(this.cameraTarget, true, 1, 1); // dont interp camera
        //this.cameras.main.roundPixels = true;

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


        socket.on('initGame', (data) => {
            console.log("Received Ship Params:", data.shipData);
            this.shipParams = data.shipData;

            // Immediately spawn ships if they don't exist
            Object.entries(data.shipData).forEach(([id, config]) => {
                if (!ships[id]) {
                    ships[id] = new Ship(this, config.x, config.y, config.params);
                }
            });
        });

        socket.emit('playerReady', { username: data.username });


        socket.on('gameState', (data) => {

            // Check if ship params have been received first
            if (!this.shipParams) return; // skip until it has arrived

            // Update ship list
            data.ships.forEach(shipData => {
                if (!ships[shipData.id]) {  // only create if it doesn't already exist

                    // Create the ship with the new params
                    const params = this.shipParams[shipData.id].params;

                    if (params) {
                        ships[shipData.id] = new Ship(this, shipData.x, shipData.y, params);
                    } else {
                        console.warn(`Failed to create ship ${shipData.id}`);
                        return;
                    }
                }

                // Update with server data
                ships[shipData.id].target = { x: shipData.x, y: shipData.y, r: shipData.r };

                // Send current velocity for extrapolation
                ships[shipData.id].velocity = { x: shipData.vx, y: shipData.vy };
                ships[shipData.id].angularVelocity = shipData.av;

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

        // Extrapolate and interpolate all game objects
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

