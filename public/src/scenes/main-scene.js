
/* global Phaser, io */

import CreateUI from "../ui/create-ui.js";
import zoom from "../objects/zoom.js";
import Shop from "../objects/shop.js";
import NetworkManager from "../managers/network-manager.js";
import GameManager from "../managers/game-manager.js";
import { ClientEvent } from "shared/built/socket-protocol.js";
import UIManager from "../managers/ui-manager.js";
import InteractionManager from "../managers/interaction-manager.js";
import InputManager from "../managers/input-manager.js";


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

        this.shipParams = null; // retrieve ship width/height etc from server
        this.showDebugHitboxes = true;
        this.debugGraphics = null;
        this.cameraTarget = null;



        // Resize canvas with window
        window.addEventListener('resize', () => {
            this.scale.resize(window.innerWidth, window.innerHeight);
        });
    }


    /**
     * Loads static assets from the filesystem into memory.
     */
    preload() {
        this.load.image("tiles", "/assets/terrain-tilesheet.png");
        this.load.image('cannon', '/assets/cannon.png');
        this.load.image('helm', '/assets/helm.png')
        this.load.image('ladder', '/assets/ladder.png')
        this.load.tilemapTiledJSON("map", "/shared/demo-map.json");
    }

    /**
     * Executed once at runtime- set up all game objects here, such
     * as setting up user input and socket listeners.
     */
    create(data) {
        this.setupWorld();

        //@ts-ignore
        const entityConfig = window.entityConfig;   // cheesed

        this.network = new NetworkManager(socket);
        this.gameManager = new GameManager(this.network, this, entityConfig);
        this.uiManager = new UIManager(this, this.gameManager);
        this.inputManager = new InputManager(this);
        this.interactionManager = new InteractionManager(this.network, this.gameManager, this.inputManager);

        this.cameraTarget = this.add.circle(0, 0, 5, 0xffffff, 0);
        this.cameras.main.startFollow(this.cameraTarget);

        // Placeholder player sprite- replace in preload() with actual
        const circle = this.make.graphics();
        circle.fillStyle(0xff0000, 1);
        circle.fillCircle(15, 15, 15);
        circle.generateTexture('player_circle', 30, 30);
        circle.destroy();

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.ui = new CreateUI(this);
        this.gameManager.on('localPlayerReady', (player) => {
            const matrix = player.getWorldTransformMatrix();
            this.ui.minimap.placeMarker(
                matrix.tx, matrix.ty,
                this.map.widthInPixels, this.map.heightInPixels
            );
            this.ui.minimap.placeShops(this.map.width, this.map.height);
        });

        this.network.emit(ClientEvent.READY, { username: data.username });

        setInterval(() => { //positional logging
            const player = this.gameManager.localPlayer;
            if (!player) return;

            const tileSize = this.map.tileWidth;
            const matrix = player.getWorldTransformMatrix();
            const tileX = Math.floor(matrix.tx / tileSize);
            const tileY = Math.floor(matrix.ty / tileSize);
            console.log(`[Player] tile x: ${tileX}, tile y: ${tileY}`);

            const ship = player.parentId ? this.gameManager.shipList[player.parentId] : null;
            if (ship) {
                console.log(`[Ship]   tile x: ${Math.floor(ship.x / tileSize)}, tile y: ${Math.floor(ship.y / tileSize)}`);
            }
        }, 1000);
    }


    /**
     * Updates dynamic content such as ships, players, etc
     */
    update() {
        this.gameManager.update();
        this.uiManager.update();
        this.network.sendMove(this.inputManager.getMovementInputs());

        // Update minimap marker with current world position
        if (this.gameManager.localPlayer) {
            const matrix = this.gameManager.localPlayer.getWorldTransformMatrix();
            this.ui.minimap.updateMarker(matrix.tx, matrix.ty);
        }
    }

    setupWorld() {
        this.map = this.make.tilemap({ key: "map" });
        const tileset = this.map.addTilesetImage("terrain-tilesheet", "tiles");

        this.map.createLayer("sea", tileset, 0, 0);
        this.map.createLayer("shallows", tileset, 0, 0);
        this.map.createLayer("islands", tileset, 0, 0);
        
        if (tileset && tileset.image) {
            tileset.image.setFilter(Phaser.Textures.FilterMode.NEAREST);
        }

    }
}
