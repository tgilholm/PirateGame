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

        
        this.layer = this.scene.add.layer();
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


    getLayer() {
        return this.layer;
    }

    
//------------temp fixes, not my own code, just testing stuff, will be replaced with something better later, but cant get anything else done without-------------------




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

            try {
                const module = await import('./ship-components/calculateComponents.js');
                const stats = await module.calculateShipStats();
                module.logStats(stats);
            } catch (error) {
                console.error('Failed to load ship stats module:', error);
            }
        });

        this.elements.push(this.printStatsButton);
    }


/*
    counteractZoom(zoomLevel) {
        //reverses zoom byt scaling and mooving UI elements inversely, temp solution, i cant get seperate UI and main layers rendered, breaks camera
        const inverseScale = 1 / zoomLevel;
        
        // Apply to all UI elements
        this.elements.forEach(element => {const original = this.originalPositions.get(element);
            if (original) {
                // Scale inversely to camera zoom
                element.setScale(inverseScale);
                
                // Reposition: scale position from center
                const camera = this.scene.cameras.main;
                const centerX = camera.width / 2;
                const centerY = camera.height / 2;
                
                // Calculate scaled offset from center
                const offsetX = (original.x - centerX) * inverseScale;
                const offsetY = (original.y - centerY) * inverseScale;
                
                element.setPosition(centerX + offsetX, centerY + offsetY);
            }
        });
    }

*/
//------------------------------------------------------------------------------------------------------------------






    toggleDebugMenu() {
        this.debugMenuVisible = !this.debugMenuVisible;
        this.printStatsButton.setVisible(this.debugMenuVisible);
    }

}


