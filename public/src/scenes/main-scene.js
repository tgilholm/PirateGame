
/* global Phaser, io */

import PlayerModel from "../models/player-model.js";
import ShipModel from "../models/ship-model.js";
import UI from "../ui/create-ui.js";
import zoom from "../objects/zoom.js";
import Shop from "../objects/shop.js";
import io from "socket.io-client";
import InputHandler from "../objects/input-handler.js";
import NetworkManager from "../managers/network-manager.js";
import { ServerEvent } from "shared/socket-protocol.js";
import GameManager from "../managers/game-manager.js";
import entityConfig from "shared/entity-config.json";
import { ClientEvent } from "shared/built/socket-protocol.js";


const socket = io();


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

        this.inputHandler = null;
        this.cameraTarget = null;
        this.shipParams = null; // retrieve ship width/height etc from server
        this.showDebugHitboxes = true;
        this.debugGraphics = null;

        this.network = new NetworkManager(socket);
        this.gameManager = new GameManager(this.network, this, entityConfig);
        this.ui = new UI(this);
    }


    /**
     * Loads static assets from the filesystem into memory.
     */
    preload() {
        this.load.image("tiles", "/assets/terrain-tilesheet.png");
        this.load.image('cannon', '/assets/cannon.png');
        this.load.image('helm', '/assets/helm.png')
        this.load.image('ladder', '/assets/ladder.png')
        this.load.tilemapTiledJSON("map", "/assets/demo-map.json");

        // Resize canvas with window
        window.addEventListener('resize', () => {
            this.scale.resize(window.innerWidth, window.innerHeight);
        });
    }

    /**
     * Executed once at runtime- set up all game objects here, such
     * as setting up user input and socket listeners.
     */
    create(data) {

        // Placeholder player sprite- replace in preload() with actual
        const circle = this.make.graphics();
        circle.fillStyle(0xff0000, 1);
        circle.fillCircle(15, 15, 15);
        circle.generateTexture('player_circle', 30, 30);
        circle.destroy();


        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(1000); // Always on top


        // Generate the tilemap from the .json
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("terrain-tilesheet", "tiles");

        map.createLayer("sea", tileset, 0, 0); // Add at 0, 0
        map.createLayer("shallows", tileset, 0, 0);
        const islands = map.createLayer("islands", tileset, 0, 0);

        this.matter.world.convertTilemapLayer(islands); // add collision to solid objects


        this.cameraTarget = this.add.container(0, 0); // follow the player
        this.cameras.main.startFollow(this.cameraTarget, true, 1, 1); // dont interp camera

        // Shop object
        this.shop = new Shop(this, 3000, 5250);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);   // don't leave the map
        this.mapWidth = map.widthInPixels;
        this.mapHeight = map.heightInPixels;

        // Keyboard input
        this.inputHandler = new InputHandler(this);


        // Show the minimap and place the initial marker
        this.ui.minimap.initializeMarker(this.cameraTarget.x, this.cameraTarget.y, this.mapWidth, this.mapHeight);


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
            // Let updateState handle the re-parenting and position snap
        });

        socket.on('climbedLadder', (data) => {
            // Let updateState handle the re-parenting and position snap
        });


        socket.emit('system:playerReady', { username: data.username });

        this.network.emit(ClientEvent.READY);
    }


    /**
     * Updates dynamic content such as ships, players, etc
     */
    update() {
        this.ui?.promptEl && (this.ui.promptEl.style.display = "none"); // Clear UI messages each frame- they will be re-added if still relevant


        const cameraTarget = this.cameraTarget;
        if (!players[socket.id]) return; // wait for player data to load


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
                this.ui.promptEl.textContent = "(E) Start Steering";
                this.ui.promptEl.style.display = "block";

                // Only send take control command if E is just pressed (not held)
                if (this.inputHandler.justPressed(this.inputHandler.keys.E)) {
                    console.log(`Attempting to take control of ship ${parentId}`);
                    socket.emit('player:takeControl', {
                        // Send ship id 
                        shipId: parentId
                    });
                }
            }

            // If controlling, display "release control" message
            if (player.parentId === parentId && player.isSteering) {
                this.ui.promptEl.textContent = "(Q) Stop Steering";
                this.ui.promptEl.style.display = "block";

                if (this.inputHandler.justPressed(this.inputHandler.keys.Q)) {
                    console.log(`Releasing control of ship ${parentId}`);
                    socket.emit('player:releaseControl', {
                        shipId: parentId
                    });
                }
            }

            // Check if near a ladder
            const ladderDists = [
                Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, ship.ladder.x, ship.ladder.y),
                Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, ship.ladder2.x, ship.ladder2.y)
            ];

            //console.log(ladderDists[0], ladderDists[1]);

            for (let i = 0; i < ladderDists.length; i++) {
                // If on ship, ladder lets players exit ship
                if (ladderDists[i] < 30 && player.parentId === parentId) {
                    this.ui.promptEl.textContent = "(E) Exit Ship";
                    this.ui.promptEl.style.display = "block";
                    if (this.inputHandler.justPressed(this.inputHandler.keys.E)) {
                        console.log(`Attempting to exit ship ${parentId}`);
                        socket.emit('player:exitShip', {
                            shipId: parentId
                        });
                    }
                }
            }


            // Player is not on a ship
        } else {
            // Calculate distance to all ladders in the world and show "climb ladder" message if near one

            for (const shipId in ships) {
                const ship = ships[shipId];

                // Convert the two ladder positions to world space
                const ladderWorldPos = [
                    Phaser.Math.RotateAround(
                        { x: ship.ladder.x, y: ship.ladder.y },
                        0, 0,
                        ship.container.rotation
                    ),
                    Phaser.Math.RotateAround(
                        { x: ship.ladder2.x, y: ship.ladder2.y },
                        0, 0,
                        ship.container.rotation
                    )
                ];

                // Calculate the player's distance to the two ladders
                const ladderDists = [
                    Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, ship.container.x + ladderWorldPos[0].x, ship.container.y + ladderWorldPos[0].y),
                    Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, ship.container.x + ladderWorldPos[1].x, ship.container.y + ladderWorldPos[1].y)
                ];

                // If close enough, display the message to climb the ladder and send the command if E is pressed
                if (ladderDists[0] < 30 || ladderDists[1] < 30) {
                    this.ui.promptEl.textContent = "(E) Climb Ladder";
                    this.ui.promptEl.style.display = "block";
                    if (this.inputHandler.justPressed(this.inputHandler.keys.E)) {
                        console.log(`Attempting to climb ladder on ship ${shipId}`);
                        socket.emit('player:enterShip', {
                            shipId: shipId,
                            ladderIndex: ladderDists[0] < 30 ? 0 : 1
                        });
                    }
                }
            }

            // Check distance to the shop
            this.shop.update(player, this.inputHandler.keys, this.ui);


            // Player is in world space
            cameraTarget.x = player.sprite.x;
            cameraTarget.y = player.sprite.y;
        }





        // Player movement
        socket.emit('player:moveInput', this.inputHandler.getMovementInput());


        // Toggle zoom when Z is pressed
        if (this.inputHandler.justPressed(this.inputHandler.shipKeys.zoom)) {
            const zoomValue = zoom.toggleZoom();
            this.cameras.main.setZoom(zoomValue);
        }

        // Update minimap marker with current world position
        this.ui.minimap.updatePlayerMarker(this.cameraTarget.x, this.cameraTarget.y, this.mapWidth, this.mapHeight);

        // // Ship movement (WASD when zoomed out)
        // socket.emit('shipInput', {
        //     up: this.gameState.canControlShip() && this.keys.W.isDown,
        //     left: this.gameState.canControlShip() && this.keys.A.isDown,
        //     right: this.gameState.canControlShip() && this.keys.D.isDown
        // });


    }
}
