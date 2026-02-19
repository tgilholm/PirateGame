/**
 * UI class handles all UI elements that are fixed to the screen
 * and unaffected by camera zoom or position.
 * rendered on different layer
 */
export default class UI {

    /**
     * 
     * @param {Phaser.Scene} scene 
     */
    constructor(scene) {
        this.scene = scene;
        this.instance = null;
        this.elements = [];
        this.layer = scene.add.layer();

        this.messageText = this.scene.add.text(this.scene.cameras.main.width / 2, 20, '', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#00000088',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1000);

        //this.createAddDeckButton();
        //this.createGoldCounter();
    }

    /**
     * Displays a message at the top of the screen
     * @param {String} message 
     */
    showMessage(message) {
        if (message) {
            this.messageText.setText(message);
            this.messageText.setVisible(true);
        }
    }

    /**
     * Hides the message at the top of the screen
     * @param {String} message 
     */
    hideMessage(message) {
        if (message && this.messageText.text === message) {
            this.messageText.setVisible(false);
            this.messageText.setText('');   // reset the text
        }
    }


    createGoldCounter() {
        const paddingRight = 20;
        const counterX = this.scene.cameras.main.width - paddingRight;
        const counterY = 30;

        this.goldCounter = this.scene.add.text(counterX, counterY, {
            fontSize: '18px',
            fill: '#ffd54f'
        })
            .setOrigin(1, 0.5)
            .setScrollFactor(0)
            .setDepth(1000);

        this.layer.add(this.goldCounter);
        this.elements.push(this.goldCounter);
    }

    getLayer() {
        return this.layer;
    }

    setGold(amount) {
        this.goldCounter.setText(`Gold: ${amount}`);
    }


    // deck elongator - can be added in by uncommenting lol

    // createAddDeckButton() {
    //     const buttonX = this.scene.cameras.main.width / 2;
    //     const buttonY = 40;

    //     this.addDeckButton = this.scene.add.text(buttonX, buttonY, 'Add Deck (10g)', {
    //         fontSize: '24px',
    //         fill: '#fff',
    //         backgroundColor: '#5d4037',
    //         padding: { x: 20, y: 10 }
    //     })
    //         .setOrigin(0.5)
    //         .setInteractive()
    //         .setScrollFactor(0)  // Fixed to camera
    //         .setDepth(1000);      // Render on top of everything

    //     this.addDeckButton.on('pointerover', () => {
    //         this.addDeckButton.setStyle({ fill: '#ffff00' });
    //     });

    //     this.addDeckButton.on('pointerout', () => {
    //         this.addDeckButton.setStyle({ fill: '#fff' });
    //     });

    //     this.deckCounter = this.scene.add.text(buttonX, buttonY + 50, 'Decks: 1 / 100', {
    //         fontSize: '16px',
    //         fill: '#fff'
    //     })
    //         .setOrigin(0.5)
    //         .setScrollFactor(0)
    //         .setDepth(1000);

    //     this.layer.add(this.addDeckButton);
    //     this.layer.add(this.deckCounter);
    //     this.elements.push(this.addDeckButton);
    //     this.elements.push(this.deckCounter);
    // }



    // onAddDeckClick(callback) {
    //     this.addDeckButton.on('pointerdown', callback);
    // }

    // setDeckCount(current, max) {
    //     this.deckCounter.setText(`Decks: ${current} / ${max}`);
    // }

    // setDeckCost(cost) {
    //     if (cost === null || cost === undefined) {
    //         this.addDeckButton.setText('Add Deck (MAX)');
    //         return;
    //     }
    //     this.addDeckButton.setText(`Add Deck (${cost}g)`);
    // }
}