//UI class handles all UI elements that are fixed to the screen, should be rendered on different layer and unaffected by camera zoom or position but not working atm.


export default class UI {
    /**
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

        
    
        this.debugMenuVisible = false;
        this.originalPositions = new Map(); 
       
        
        // Store original positions for zoom counteraction
        this.elements.forEach(element => {
            this.originalPositions.set(element, {
                x: element.x,
                y: element.y
            });
        });
        this.createPrintStatsButton();
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

    //Hides the message at the top of the screen
    hideMessage(message) {
        if (message && this.messageText.text === message) {
            this.messageText.setVisible(false);
            this.messageText.setText('');   // reset the text
        }
    }


    getLayer() {
        return this.layer;
    }

    
//------------temp fixes, not my own code, just testing stuff, will be replaced with something better later, but cant get anything else done without-------------------

    //gets stats from server
    async fetchShipStats() {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const stats = await response.json();
            console.log('=== SHIP STATS ===', stats);
            return stats;
        } catch (error) {
            console.error('Failed to fetch ship stats:', error);
            return null;
        }
    }

    createPrintStatsButton() {
        const buttonX = 100; // Left side of screen
        const buttonY = this.scene.cameras.main.height / 2 + 60; // Below the plank button

        this.printStatsButton = this.scene.add.text(buttonX, buttonY, 'Print Ship Stats', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#4169e1',
            padding: { x: 15, y: 8 }
        })
            .setOrigin(0.5)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(10000)
            .setVisible(false); // Initially hidden

        this.printStatsButton.on('pointerover', () => {
            this.printStatsButton.setStyle({ fill: '#ffff00' });
        });

        this.printStatsButton.on('pointerout', () => {
            this.printStatsButton.setStyle({ fill: '#fff' });
        });

        this.printStatsButton.on('pointerdown', async () => {
            console.log('=== SHIP STATS ===');
            const stats = await this.fetchShipStats();
        });

        this.elements.push(this.printStatsButton);
    }


//------------------------------------------------------------------------------------------------------------------


    toggleDebugMenu() {
        this.debugMenuVisible = !this.debugMenuVisible;
        this.printStatsButton.setVisible(this.debugMenuVisible);
    }

}


