
/* global Phaser, io */

import Player from "../objects/player.js";
import Ship from "../objects/ship.js";
import UI from "../objects/UI/createUI.js";
import zoom from "../objects/zoom.js";
import Shop from "../objects/shop.js";
import InputHandler from "../objects/inputHandler.js";
import InteractionSystem from "../objects/interactionSystem.js";
import ClientSocketHandler from "../objects/clientSocketHandler.js";


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

        this.inputHandler = null;
        this.cameraTarget = null;
        this.shipParams = null; // retrieve ship width/height etc from server
        this.showDebugHitboxes = true;
        this.debugGraphics = null;
        //this.gameState = new gameState();
        //this.playerInventory = new PlayerInventory(this);
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

        window.addEventListener('resize', () => {
            this.scale.resize(window.innerWidth, window.innerHeight);
        });

    }

    /**
     * Executed once at runtime- set up all game objects here, such
     * as setting up user input and socket listeners.
     */
    create(data) {
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(1000); // Always on top

        // Initialize UI
        this.ui = new UI(this);

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

        // Interaction system — helm, ladders, shop
        this.interactionSystem = new InteractionSystem(socket);

        // Socket event handlers
        new ClientSocketHandler(socket, this, ships, players);

        socket.emit('system:playerReady', { username: data.username });
    }


    /**
     * Updates dynamic content such as ships, players, etc
     */
    update() {
        this.ui?.promptEl && (this.ui.promptEl.style.display = "none"); // Clear UI messages each frame

        if (!players[socket.id]) return; // wait for player data to load

        // Extrapolate and interpolate all game objects
        Object.values(ships).forEach(ship => ship.update());
        Object.values(players).forEach(player => player.update());

        const player   = players[socket.id];
        const parentId = player.parentId;

        // Update camera position
        if (parentId && ships[parentId]) {
            const worldPos = ships[parentId].getPlayerWorldPos(player);
            this.cameraTarget.x = worldPos.x;
            this.cameraTarget.y = worldPos.y;
        } else {
            this.cameraTarget.x = player.sprite.x;
            this.cameraTarget.y = player.sprite.y;
        }

        // Run proximity interactions (helm, ladders, shop)
        this.interactionSystem.update(player, parentId, ships, this.inputHandler, this.ui, this.shop);

        // Player movement
        socket.emit('player:moveInput', this.inputHandler.getMovementInput());

        // Toggle zoom when Z is pressed
        if (this.inputHandler.justPressed(this.inputHandler.shipKeys.zoom)) {
            const zoomValue = zoom.toggleZoom();
            this.cameras.main.setZoom(zoomValue);
        }

        // Update minimap marker with current world position
        this.ui.minimap.updatePlayerMarker(this.cameraTarget.x, this.cameraTarget.y, this.mapWidth, this.mapHeight);
    }
}
