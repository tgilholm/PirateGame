import { StartScene } from "./start-scene.js";
import { MainScene } from "./main-scene.js";

const parent = document.getElementById('game-container');

// Set up game 
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    roundPixels: false,
    backgroundColor: '#2d80c9',
    parent: parent,
    scene: [StartScene, MainScene],     // Add all scenes in

    physics: {
        default: 'matter',  // for complex physics
        matter: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
};

const game = new Phaser.Game(config);
