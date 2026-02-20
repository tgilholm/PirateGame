/* global Phaser, io */

import Player from "../objects/player.js";
import Ship from "../objects/ship.js";
import UI from "../objects/ui.js";
import gameState from "../managers/gameState.js";
import Plank from "../objects/items/plank.js";
import PlayerInventory from "../objects/playerInventory.js";


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
        this.cameraTarget = null;
        this.shipParams = null; // retrieve ship width/height etc from server
        this.showDebugHitboxes = true;
        this.debugGraphics = null;
        this.gameState = new gameState();
        this.playerInventory = new PlayerInventory(this);


    }


    /**
     * Loads static assets from the filesystem into memory.
     */
    preload() {
        // Load the tilesheet
        this.load.image("tiles", "/assets/terrain-tilesheet.png");
        this.load.image('cannon', '/assets/cannon.png');
        this.load.image('helm', '/assets/helm.png')
        this.load.image('ladder', '/assets/ladder.png')

        // Load the map
        this.load.tilemapTiledJSON("map", "/assets/demo-map.json");

        // Load the plank
        this.load.image("plank", "/assets/plank.png");

    }

    /**
     * Executed once at runtime- set up all game objects here, such
     * as setting up user input and socket listeners.
     */
    create(data) {
        this.ui = new UI(this);
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(1000); // Always on top

        // Cameras

        // Initialize UI
        this.ui = new UI(this);
        this.ui.setGold(0); // Start with 0 gold

        // Generate the tilemap from the .json
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("terrain-tilesheet", "tiles");

        map.createLayer("sea", tileset, 0, 0); // Add at 0, 0
        map.createLayer("shallows", tileset, 0, 0);
        const islands = map.createLayer("islands", tileset, 0, 0);

        this.matter.world.convertTilemapLayer(islands); // add collision to solid objects


        this.cameraTarget = this.add.container(0, 0); // follow the player
        this.cameras.main.startFollow(this.cameraTarget, true, 1, 1); // dont interp camera
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);   // don't leave the map

        // Keyboard input
        this.keys = /** @type {any} */ (this.input.keyboard.addKeys("W, A, S, D, E, Q, space"));
        this.shipKeys = /** @type {any} */ (this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            zoom: Phaser.Input.Keyboard.KeyCodes.Z,
            debug: Phaser.Input.Keyboard.KeyCodes.X
        }));


        // Generate the entire game once when the "handshake" is received
        socket.on('initGame', (data) => {
            console.log('[Client] Received initGame', data);

            // Create all ships from server data
            if (data.shipData && Array.isArray(data.shipData)) {
                data.shipData.forEach(shipData => {
                    if (!ships[shipData.id]) {
                        console.log(`[Client] Creating ship: ${shipData.id}`);
                        ships[shipData.id] = new Ship(this, shipData.x, shipData.y, shipData.params);
                    }
                });
            }

            // Create all players from server data
            if (data.playerData && Array.isArray(data.playerData)) {
                data.playerData.forEach(playerData => {
                    if (!players[playerData.id]) {
                        console.log(`[Client] Creating player: ${playerData.id}`);
                        players[playerData.id] = new Player(this, playerData.id);
                    }

                    // Update player state
                    const shipParent = playerData.parentId ? ships[playerData.parentId] : null;
                    players[playerData.id].updateState(playerData, shipParent);
                });
            }
        });



        socket.on('gameState', (data) => {
            // Update ships
            if (data.ships && Array.isArray(data.ships)) {
                data.ships.forEach(shipData => {
                    if (ships[shipData.id]) {
                        ships[shipData.id].target = {
                            x: shipData.x,
                            y: shipData.y,
                            r: shipData.r
                        };
                        ships[shipData.id].velocity = {
                            x: shipData.vx || 0,
                            y: shipData.vy || 0
                        };
                        ships[shipData.id].angularVelocity = shipData.av || 0;
                    }
                });
            }

            // Update players
            if (data.players && Array.isArray(data.players)) {
                data.players.forEach(playerData => {
                    if (players[playerData.id]) {
                        const shipParent = playerData.parentId ? ships[playerData.parentId] : null;
                        players[playerData.id].updateState(playerData, shipParent);
                    }
                });
            }
        });

        // Respond to server confirmation of control takeover 
        socket.on('controlTaken', () => {
            const player = players[socket.id];
            player.isSteering = true;
        });

        socket.on('controlReleased', () => {
            const player = players[socket.id];
            player.isSteering = false;
        });

        socket.on('exitedShip', (data) => {
            const player = players[socket.id];
            player.parentId = null;
        });

        socket.on('climbedLadder', (data) => {
            const player = players[socket.id];
            const ship = ships[data.shipId];
            if (ship) {
                player.parentId = data.shipId;
            }
        });


        socket.emit('system:playerReady', { username: data.username });
    }


    /**
     * Updates dynamic content such as ships, players, etc
     */
    update() {
        console.log(ships, players);
        if (!players[socket.id]) return; // wait for player data to load

        const cameraTarget = this.cameraTarget;

        // Extrapolate and interpolate all game objects
        Object.values(ships).forEach(ship => ship.update());
        Object.values(players).forEach(player => player.update());


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

            // If near the helm, display the "take control" message
            const helmPos = { x: ship.helm.x, y: ship.helm.y };
            const dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, helmPos.x, helmPos.y)


            // Helm controls
            if (dist < 30 && !player.isSteering) { // only show if not already controlling
                this.ui.showMessage("[E] - Control Ship");

                // Only send take control command if E is just pressed (not held)
                if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
                    console.log(`Attempting to take control of ship ${parentId}`);
                    socket.emit('player:takeControl', {
                        // Send ship id 
                        shipId: parentId
                    });
                }

            } else {
                this.ui.hideMessage("[E] - Control Ship");
            }

            // If controlling, display "release control" message
            if (player.parentId === parentId && player.isSteering) {
                this.ui.showMessage("[Q] - Release Control");

                if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
                    console.log(`Releasing control of ship ${parentId}`);
                    socket.emit('player:releaseControl', {
                        shipId: parentId
                    });
                }
            } else {
                this.ui?.hideMessage("[Q] - Release Control");
            }

            // Check if near a ladder
            const ladderDists = [
                Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, ship.ladder.x, ship.ladder.y),
                Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, ship.ladder2.x, ship.ladder2.y)
            ];

            for (let i = 0; i < ladderDists.length; i++) {
                // If on ship, ladder lets players exit ship
                if (ladderDists[i] < 30 && player.parentId === parentId) {
                    this.ui.showMessage("[E] - Exit Ship");
                    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
                        console.log(`Attempting to exit ship ${parentId}`);
                        socket.emit('player:exitShip', {
                            shipId: parentId
                        });
                    }

                }

                // If not on ship, ladder lets players enter ship
                else if (ladderDists[i] < 30 && player.parentId !== parentId) {
                    this.ui.showMessage("[E] - Climb Ladder");
                    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
                        console.log(`Attempting to climb ladder on ship ${parentId}`);
                        socket.emit('player:enterShip', {
                            shipId: parentId,
                            ladderIndex: i
                        });
                    }
                }
            }


        } else {
            // Player is in world space
            cameraTarget.x = player.sprite.x;
            cameraTarget.y = player.sprite.y;
        }



        // Player movement
        socket.emit('player:moveInput', {
            up: this.keys.W.isDown,
            left: this.keys.A.isDown,
            down: this.keys.S.isDown,
            right: this.keys.D.isDown,
            e: this.keys.E.isDown,
            q: this.keys.Q.isDown,
            space: this.keys.space.isDown
        });


        // Toggle zoom when Z is pressed
        if (Phaser.Input.Keyboard.JustDown(this.shipKeys.zoom)) {
            this.gameState.toggleZoom();
            const zoomValue = this.gameState.getZoomValue();
            this.cameras.main.setZoom(zoomValue);
            this.ui.counteractZoom(zoomValue);
        }

        // Toggle debug menu when X is pressed
        if (Phaser.Input.Keyboard.JustDown(this.shipKeys.debug)) {
            this.ui.toggleDebugMenu();
        }

        // // Ship movement (WASD when zoomed out)
        // socket.emit('shipInput', {
        //     up: this.gameState.canControlShip() && this.keys.W.isDown,
        //     left: this.gameState.canControlShip() && this.keys.A.isDown,
        //     right: this.gameState.canControlShip() && this.keys.D.isDown
        // });


    }
}
