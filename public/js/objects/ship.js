//import Helm from "./helm.js";
import Parent from "./parent.js";

/**
 * The Ship class provides a moving body on which Interactables and Players can exist.
 * It can move independently and all objects "attached" to it will move with it- players'
 * movement is added on to the ship's movement so that in the world space, players move
 * independently of the ship.
 * 
 */
export default class Ship// extends Parent {
{
    constructor(scene, x, y) {
        this.scene = scene;

        this.container = scene.add.container(x, y);
        
        // Deck properties
        this.deckWidth = 200;
        this.deckHeight = 160;
        this.maxDecks = 100;
        this.decks = [{ x: -150, y: -80 }]; // Array of deck positions, starting with one deck
        
        // Graphics for the hull (decks + bow)
        this.hullGraphics = scene.add.graphics();
        this.drawHull();
        
        this.container.add(this.hullGraphics);
        
        // Create cannon indicators (one set per deck)
        this.cannonIndicators = this.scene.add.graphics();
        this.drawCannonIndicators();
        
        this.container.add(this.cannonIndicators);
        
        // Set initial pivot point
        this.updatePivot();
    }

    drawCannonIndicators() {
        // Clear existing cannon indicators
        this.cannonIndicators.clear();
        
        this.cannonIndicators.fillStyle(0x808080, 0.5); // grey, semi-transparent
        this.cannonIndicators.lineStyle(2, 0x000000, 0.5);
        
        const sideOffset = 80;  // Distance from center to ship's edge
        const coneWidth = 30;   // Half-width of cone base
        const coneLength = 120; // How far cone extends from ship
        
        // Draw cannon indicators for each deck
        for (let deck of this.decks) {
            const deckCenterX = deck.x + this.deckWidth / 2;
            
            // Port side triangle (top/left) - apex at deck center
            this.cannonIndicators.beginPath();
            this.cannonIndicators.moveTo(deckCenterX, -sideOffset);
            this.cannonIndicators.lineTo(deckCenterX - coneWidth, -sideOffset - coneLength);
            this.cannonIndicators.lineTo(deckCenterX + coneWidth, -sideOffset - coneLength);
            this.cannonIndicators.closePath();
            this.cannonIndicators.fillPath();
            this.cannonIndicators.strokePath();
            
            // Starboard side triangle (bottom/right) - apex at deck center
            this.cannonIndicators.beginPath();
            this.cannonIndicators.moveTo(deckCenterX, sideOffset);
            this.cannonIndicators.lineTo(deckCenterX - coneWidth, sideOffset + coneLength);
            this.cannonIndicators.lineTo(deckCenterX + coneWidth, sideOffset + coneLength);
            this.cannonIndicators.closePath();
            this.cannonIndicators.fillPath();
            this.cannonIndicators.strokePath();
        }
        
        this.cannonIndicators.setVisible(false);
    }

    drawHull() {
        // Clear existing graphics
        this.hullGraphics.clear();
        
        // Set style
        this.hullGraphics.fillStyle(0x5d4037, 1); // dark brown
        this.hullGraphics.lineStyle(4, 0x3e2723, 1);
        
        // Draw all deck sections
        for (let deck of this.decks) {
            this.hullGraphics.fillRect(deck.x, deck.y, this.deckWidth, this.deckHeight);
            this.hullGraphics.strokeRect(deck.x, deck.y, this.deckWidth, this.deckHeight);
        }
        
        // Draw the bow (triangle at front)
        const frontDeck = this.decks[0];
        const bowStartX = frontDeck.x + this.deckWidth;
        
        this.hullGraphics.beginPath();
        this.hullGraphics.moveTo(bowStartX, -80);
        this.hullGraphics.lineTo(bowStartX + 80, 0);
        this.hullGraphics.lineTo(bowStartX, 80);
        this.hullGraphics.closePath();
        this.hullGraphics.fillPath();
        this.hullGraphics.strokePath();
    }

    addDeck() {
        if (this.decks.length >= this.maxDecks) {
            return false;
        }

        // Calculate position for new deck (behind the last deck)
        const lastDeck = this.decks[this.decks.length - 1];
        const newDeck = {
            x: lastDeck.x - this.deckWidth,
            y: lastDeck.y
        };
        
        this.decks.push(newDeck);
        this.drawHull();
        this.drawCannonIndicators();
        this.updatePivot();
        return true;
    }

    updatePivot() {
        // Calculate the middle deck position for rotation pivot
        const numDecks = this.decks.length;
        let pivotX;

        if (numDecks % 2 === 1) {
            // Odd number of decks: use the middle deck
            const middleIndex = Math.floor(numDecks / 2);
            const middleDeck = this.decks[middleIndex];
            pivotX = middleDeck.x + this.deckWidth / 2;
        } else {
            // Even number of decks: use the center between the two middle decks
            const middleIndex1 = numDecks / 2 - 1;
            const middleIndex2 = numDecks / 2;
            const deck1 = this.decks[middleIndex1];
            const deck2 = this.decks[middleIndex2];
            pivotX = (deck1.x + this.deckWidth / 2 + deck2.x + this.deckWidth / 2) / 2;
        }
        
        // Offset all graphics so pivot point aligns with origin
        const offsetX = -pivotX;
        this.hullGraphics.setPosition(offsetX, 0);
        this.cannonIndicators.setPosition(offsetX, 0);
    }
             

    showCannonIndicators() {
        if (this.cannonIndicators) {
            this.cannonIndicators.setVisible(true);
        }
    }
    
    hideCannonIndicators() {
        if (this.cannonIndicators) {
            this.cannonIndicators.setVisible(false);
        }
    }

    update(data) {
        this.container.x = Phaser.Math.Linear(this.container.x, data.x, 0.2); // interpolate 20% between the old and new data
        this.container.y = Phaser.Math.Linear(this.container.y, data.y, 0.2);
        this.container.rotation = data.rotation;    // don't interpolate rotation
    }
}







    // /**
    //  * Generates a new instance of a Ship at the provided coordinates.
    //  * @param {Phaser.Scene} scene The Phaser.Scene this ship is created in
    //  * @param {Number} x The absolute (world-scope) X coordinate of the ship 
    //  * @param {Number} y The absolute (world-scope) Y coordinate of the ship 
    //  */
    // constructor(scene, x, y) {
    //     this.scene = scene;
    //     this.x = x;
    //     this.y = y;
    //     this.rotation = 0;  // Initial rotation is 0;

    //     // Draw the ship
    //     this.container = scene.add.container(x, y);
    //     this.graphics = scene.add.graphics();
    //     this.drawHull();
    //     this.container.add(this.graphics);

    //     // Attach interactables
    //     //this.helm = new Helm(this, -120, 0); // At the back of the ship

    //     //.. add other interactables here
    // }

    // /**
    //  * Draws a simple "hull" shape consisting of a rectangle
    //  * connected to a triangle.
    //  */
    // drawHull() {
    //     this.graphics.fillStyle(0x5d4037, 1); // dark brown
    //     this.graphics.lineStyle(4, 0x3e2723, 1);

    //     // Rectangle
    //     this.graphics.fillRect(-150, -80, 200, 160);
    //     this.graphics.strokeRect(-150, -80, 200, 160);

    //     // Triangle
    //     this.graphics.beginPath();
    //     this.graphics.moveTo(50, -80);
    //     this.graphics.lineTo(130, 0);
    //     this.graphics.lineTo(50, 80);
    //     this.graphics.closePath();
    //     this.graphics.fillPath();
    //     this.graphics.strokePath();
    // }

    // /**
    //  * Checks whether the provided coordinates (of an interactable or player) are within
    //  * the bounds of the ship's hull. 
    //  * @param {Number} localX The x coordinate of the object relative to the ship
    //  * @param {Number} localY The y coordinate of the object relative to the ship
    //  * @returns True if the object is "inside" the ship, false otherwise
    //  */
    // isOnDeck(localX, localY) {
    //     const halfWidth = 80;

    //     // Is the object in the "main rectangle"
    //     if (localX >= -150 && localX <= 50) {   // check left to right
    //         return Math.abs(localY) <= halfWidth; // check up and down
    //     }


    //     // Is the object in the "bow" triangle
    //     if (localX > 50 && localX <= 130) { // check left to right

    //         // calculate the taper of the bow and check if inside
    //         const taper = (1 - (localX - 50) / 80) * halfWidth;
    //         return Math.abs(localY) <= taper;
    //     }
    //     return false; // if neither returned true
    // }


    // /**
    //  * Uses linear interpolation to smooth out space between ship movement frames
    //  * @param {Number, Number} serverData the x and y coordinates of the ship as it appears on the server
    //  */
    // update(serverData) {

    //     this.x = Phaser.Math.Linear(this.x, serverData.x, 0.2); // interpolate 20% between the old and new data
    //     this.y = Phaser.Math.Linear(this.y, serverData.y, 0.2);
    //     this.rotation = serverData.rotation;    // don't interpolate rotation

    //     // update the position of the ship
    //     this.container.setPosition(this.x, this.y);
    //     this.container.setRotation(this.rotation);
    // }
