/* global Phaser, io */

import Ship from "./objects/ship.js";
import UI from "./objects/UI.js";
import { Start } from "./start.js";

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');

        this.socket = null;
        this.ship = null;
        this.keys = null;
        this.ui = null;
        this.worldGraphics = null;
        this.uiCamera = null;
        this.gold = 100000000;
        this.deckCosts = [10, 50, 100, 200, 300, 400, 500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 5000, 7500, 10000];
        this.decksPurchased = 0;
    }

    preload() {}

    create() {
        const socketFactory = /** @type {any} */ (globalThis.io);
        this.socket = socketFactory();
        this.keys = /** @type {any} */ (this.input.keyboard.addKeys("W, A, S, D, SPACE"));
        const graphics = this.add.graphics();
        this.worldGraphics = graphics;
        graphics.setDepth(-1); // Add this line - render grid behind everything
        const worldSize = 5000;

        graphics.lineStyle(2, 0x2472b5, 1);

        for (let i = -worldSize; i < worldSize; i += 200) {
            graphics.lineBetween(i, -worldSize, i, worldSize);
            graphics.lineBetween(-worldSize, i, worldSize, i);
        }

        this.ship = new Ship(this, 500, 500);

        this.cameras.main.startFollow(this.ship.container); 

        this.ui = new UI(this);
        this.ui.setDeckCount(this.ship.decks.length, this.ship.maxDecks);
        this.ui.setGold(this.gold);
        this.ui.setDeckCost(this.deckCosts[this.decksPurchased]);
        this.ui.onAddDeckClick(() => {
            const cost = this.deckCosts[this.decksPurchased];
            if (cost === undefined || this.ship.decks.length >= this.ship.maxDecks) {
                return;
            }
            if (this.gold >= cost) {
                const added = this.ship.addDeck();
                if (added) {
                    this.gold -= cost;
                    this.decksPurchased += 1;

                    const currentZoom = this.cameras.main.zoom;
                    const zoomDecrement = 0.85;
                    this.cameras.main.setZoom(currentZoom * zoomDecrement);
                }
            }
            this.ui.setDeckCount(this.ship.decks.length, this.ship.maxDecks);
            this.ui.setGold(this.gold);
            const nextCost = this.deckCosts[this.decksPurchased];
            this.ui.setDeckCost(nextCost);
        });

        this.uiCamera = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.uiCamera.ignore([this.worldGraphics, this.ship.container]);
        this.cameras.main.ignore(this.ui.getLayer());

        this.socket.on('shipUpdate', (data) => {
            this.ship.update(data);
        });
    }

    update() {
        if (!this.ship) return;

        const input = {
            up: this.keys.W.isDown,
            down: this.keys.S.isDown,
            left: this.keys.A.isDown,
            right: this.keys.D.isDown,
            shoot: this.keys.SPACE.isDown,
            deckCount: this.ship.decks.length
        };
        this.socket.emit('shipInput', input);

        if (this.keys.SPACE.isDown) {
            this.ship.showCannonIndicators();
        } else {
            this.ship.hideCannonIndicators();
        }

        if (this.ui) {
            this.ui.update();
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d80c9',
    parent: 'game-container',
    scene: [Start, MainScene]
};

const game = new Phaser.Game(config);