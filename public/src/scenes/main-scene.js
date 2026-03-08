
/* global Phaser, io */

import NetworkManager from "../managers/network-manager.js";
import GameManager from "../managers/game-manager.js";
import UIManager from "../managers/ui-manager.js";
import InputManager from "../managers/input-manager.js";
import ModelFactory from "../managers/model-factory.js";


const socket = globalThis.io();


/**
 * The main scene of the Phaser game. This class should act as the "orchestrator"
 * of the client-side manager classes, by delegating responsibility into separate classes
 * and updating them in the update() loop.
 */
export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');

        this.shipParams = null; // retrieve ship width/height etc from server
        this.showDebugHitboxes = true;
        this.debugGraphics = null;
        this.cameraTarget = null;
        this.projectiles = new Map();


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
        this.setupWorld();

        //@ts-ignore cheesed into this window
        const entityConfig = window.entityConfig;   
        const modelFactory = new ModelFactory(this, entityConfig);


        this.gameManager = new GameManager(
            this,
            new NetworkManager(socket),
            new InputManager(this),
            modelFactory
        );
        this.uiManager = new UIManager(this, this.gameManager);

        // Invisible sprite ignoring player on/off ship state, always follows thi
        this.cameraTarget = this.add.circle(0, 0, 5, 0xffffff, 0);
        this.cameras.main.startFollow(this.cameraTarget);

        // Placeholder player sprite- replace in preload() with actual
        const circle = this.make.graphics();
        circle.fillStyle(0xff0000, 1);
        circle.fillCircle(15, 15, 15);
        circle.generateTexture('player_circle', 30, 30);
        circle.destroy();

        // Placeholder cannonball sprite
        const proj = this.make.graphics();
        proj.fillStyle(0x222222, 1);
        proj.fillCircle(5, 5, 5);
        proj.generateTexture('cannonball', 10, 10);
        proj.destroy();

        // Contain the camera in the map
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.gameManager.start(data.username);
    }

    /**
     * The update loop of the game. Updates all dependent classes 
     */
    update() {
        this.gameManager.update();
        this.uiManager.update();

        // Update minimap marker with current world position
        //this.ui.minimap.updatePlayerMarker(this..x, this.cameraTarget.y, this.mapWidth, this.mapHeight);
    }

    /**
     * Generates the tilemap for this world from the provided tilesheet
     */
    setupWorld() {
        this.map = this.make.tilemap({ key: "map" });
        const tileset = this.map.addTilesetImage("terrain-tilesheet", "tiles");

        this.seaLayer = this.map.createLayer("sea", tileset, 0, 0);
        this.shallowsLayer = this.map.createLayer("shallows", tileset, 0, 0);
        this.islandsLayer = this.map.createLayer("islands", tileset, 0, 0);

        [this.seaLayer, this.shallowsLayer, this.islandsLayer].forEach(l => l.setCullPadding(2, 2));
    }
}
