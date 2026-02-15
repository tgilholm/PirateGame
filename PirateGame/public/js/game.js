/* global io */

import Ship from "./objects/ship.js";

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d80c9',
    parent: 'game-container',

    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let socket;
let ship;
let keys;
let cursors;

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

    islands.setCollisionByProperty({ collides: true });

    socket = io();
    keys = this.input.keyboard.addKeys("W, A, S, D");
    ship = new Ship(this, 300, 400);


    // uncomment to show collision spaces
    // const debugGraphics = this.add.graphics().setAlpha(0.75);
    // islands.renderDebug(debugGraphics, {
    //     tileColor: null, // Color of non-colliding tiles
    //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
    //     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    // });


    cameras.startFollow(ship.container, true, 0.2, 0.2);  // follow ship slightly behind
    cameras.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    socket.on('shipUpdate', (data) => {

        ship.onServerUpdate(data);
    });
}

function update() {
    if (!ship) return;

    ship.update();

    const input = {
        up: keys.W.isDown,
        down: keys.S.isDown,
        left: keys.A.isDown,
        right: keys.D.isDown
    };
    socket.emit('shipInput', input);

    this.physics.add.collider(ship, )
}