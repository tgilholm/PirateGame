/* global Phaser, io */

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

function preload() {}


function create() {
    socket = io();
    keys = this.input.keyboard.addKeys("W, A, S, D");
    const graphics = this.add.graphics();
    const worldSize = 5000;

    graphics.lineStyle(2, 0x2472b5, 1);

    // Add in lines for motion reference
    for (let i = -worldSize; i < worldSize; i+= 200)
    {
        graphics.lineBetween(i, -worldSize, i, worldSize);
        graphics.lineBetween(-worldSize, i, worldSize, i);
    }

    ship = new Ship(this, 500, 500);

    this.cameras.main.startFollow(ship.container);

    socket.on('shipUpdate', (data) => {
        ship.update(data);
    });
}

function update() {
    if (!ship) return;

    const input = {
        up: keys.W.isDown,
        down: keys.S.isDown,
        left: keys.A.isDown,
        right: keys.D.isDown
    };
    socket.emit('shipInput', input);
}