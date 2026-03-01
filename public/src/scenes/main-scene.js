
/* global Phaser, io */

import UI from "../ui/create-ui.js";
import zoom from "../objects/zoom.js";
import Shop from "../objects/shop.js";
import io from "socket.io-client";
import NetworkManager from "../managers/network-manager.js";
import GameManager from "../managers/game-manager.js";
import entityConfig from "shared/entity-config.json";
import { ClientEvent } from "shared/built/socket-protocol.js";
import UIManager from "../managers/ui-manager.js";
import InteractionManager from "../managers/interaction-manager.js";
import InputManager from "../managers/input-manager.js";


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

        this.cameraTarget = null;
        this.shipParams = null; // retrieve ship width/height etc from server
        this.showDebugHitboxes = true;
        this.debugGraphics = null;

        this.network = new NetworkManager(socket);
        this.gameManager = new GameManager(this.network, this, entityConfig);
        this.uiManager = new UIManager(this, this.gameManager);
        this.inputManager = new InputManager(this);
        this.interactionManager = new InteractionManager(this.network, this.gameManager, this.inputManager)

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


        // Generate the tilemap from the .json
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("terrain-tilesheet", "tiles");

        map.createLayer("sea", tileset, 0, 0); // Add at 0, 0
        map.createLayer("shallows", tileset, 0, 0);
        const islands = map.createLayer("islands", tileset, 0, 0);

        //this.matter.world.convertTilemapLayer(islands); // add collision to solid objects

        // Placeholder player sprite- replace in preload() with actual
        const circle = this.make.graphics();
        circle.fillStyle(0xff0000, 1);
        circle.fillCircle(15, 15, 15);
        circle.generateTexture('player_circle', 30, 30);
        circle.destroy();
    }

    /**
     * Executed once at runtime- set up all game objects here, such
     * as setting up user input and socket listeners.
     */
    create(data) {
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(1000); // Always on top


        this.cameraTarget = this.add.container(0, 0); // follow the player
        this.cameras.main.startFollow(this.cameraTarget, true, 1, 1); // dont interp camera

        // Shop object
        this.shop = new Shop(this, 3000, 5250);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);   // don't leave the map


        // Show the minimap and place the initial marker
        this.ui.minimap.initializeMarker(this.cameraTarget.x, this.cameraTarget.y, this.mapWidth, this.mapHeight);


        socket.emit('system:playerReady', { username: data.username });

        this.network.emit(ClientEvent.READY);
    }


    /**
     * Updates dynamic content such as ships, players, etc
     */
    update() {
        this.gameManager.update();
        this.uiManager.update();
        this.network.sendMove(this.inputManager.getMovementInputs());


        const inputs = this.inputHandler.getInputs();
        this.network.sendMove(inputs);


        const cameraTarget = this.cameraTarget;
        if (!players[socket.id]) return; // wait for player data to load



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


            // Check distance to the shop
            this.shop.update(player, this.inputHandler.keys, this.ui);


            // Player is in world space
            cameraTarget.x = player.sprite.x;
            cameraTarget.y = player.sprite.y;
        }


        // Toggle zoom when Z is pressed
        if (this.inputHandler.justPressed(this.inputHandler.shipKeys.zoom)) {
            const zoomValue = zoom.toggleZoom();
            this.cameras.main.setZoom(zoomValue);
        }

        // Update minimap marker with current world position
        this.ui.minimap.updatePlayerMarker(this.cameraTarget.x, this.cameraTarget.y, this.mapWidth, this.mapHeight);

    }
}
