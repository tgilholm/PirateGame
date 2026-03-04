
/* global Phaser, io */

import NetworkManager from "../managers/network-manager.js";
import GameManager from "../managers/game-manager.js";
import UIManager from "../managers/ui-manager.js";
import InputManager from "../managers/input-manager.js";


const socket = globalThis.io();


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

        this.gameManager = new GameManager(
            this, 
            entityConfig, 
            new NetworkManager(socket), 
            new InputManager(this)
        );
        this.uiManager = new UIManager(this, this.gameManager);


        this.cameraTarget = this.add.circle(0, 0, 5, 0xffffff, 0);
        this.cameras.main.startFollow(this.cameraTarget);

        // Placeholder player sprite- replace in preload() with actual
        const circle = this.make.graphics();
        circle.fillStyle(0xff0000, 1);
        circle.fillCircle(15, 15, 15);
        circle.generateTexture('player_circle', 30, 30);
        circle.destroy();

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        

        this.gameManager.start(data.username);
    }

    /**
     * Updates dynamic content such as ships, players, etc
     */
    update() {
        this.gameManager.update();
        this.uiManager.update();


        // Update minimap marker with current world position
        //this.ui.minimap.updatePlayerMarker(this..x, this.cameraTarget.y, this.mapWidth, this.mapHeight);
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
