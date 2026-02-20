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
        this.layer = this.scene.add.layer();
        this.hotbar = this.scene.add.container(0, 0);
        this.hotbarSlots = [];
        this.hotbarIcons = [];
        this.debugMenuVisible = false;
        this.originalPositions = new Map();
        this.createGoldCounter();
        this.createHotbar();
        this.createGivePlankButton();

        // Store original positions for zoom counteraction
        this.elements.forEach(element => {
            this.originalPositions.set(element, {
                x: element.x,
                y: element.y
            });
        });
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
     */
    clear() {
        this.messageText.setVisible(false);
        this.messageText.setText('');   // reset the text
    }



createGoldCounter() {
    const paddingRight = 20;
    const counterX = this.scene.cameras.main.width - paddingRight;
    const counterY = 30;

    this.goldCounter = this.scene.add.text(counterX, counterY, 'Gold: 0', {
        fontSize: '24px',
        fill: '#ffd54f',
        fontStyle: 'bold'
    })
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(10000);

    this.elements.push(this.goldCounter);
}



getLayer() {
    return this.layer;
}

setGold(amount) {
    this.goldCounter.setText(`Gold: ${amount}`);
}

createGivePlankButton() {
    const buttonX = 100; // Left side of screen
    const buttonY = this.scene.cameras.main.height / 2; // Center vertically

    this.givePlankButton = this.scene.add.text(buttonX, buttonY, 'Give Plank', {
        fontSize: '20px',
        fill: '#fff',
        backgroundColor: '#8b4513',
        padding: { x: 15, y: 8 }
    })
        .setOrigin(0.5)
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(10000)
        .setVisible(false); // Initially hidden

    this.givePlankButton.on('pointerover', () => {
        this.givePlankButton.setStyle({ fill: '#ffff00' });
    });

    this.givePlankButton.on('pointerout', () => {
        this.givePlankButton.setStyle({ fill: '#fff' });
    });

    this.givePlankButton.on('pointerdown', () => {
        this.scene.playerInventory.addToInventory({ type: 'plank', name: 'Plank' });
        this.updateHotbar();
    });

    this.elements.push(this.givePlankButton);
}








//------------temp hotbar and zoom fixes, not my own code, just testing stuff, will be replaced with something better later, but cant get anything else done without-------------------

createHotbar() {
    const paddingBottom = 20;
    const hotbarX = this.scene.cameras.main.width / 2;
    const hotbarY = this.scene.cameras.main.height - paddingBottom;

    const slotSize = 50;
    const slotSpacing = 5;
    const totalSlots = 9;
    const padding = 10;
    const totalWidth = (slotSize * totalSlots) + (slotSpacing * (totalSlots - 1)) + (padding * 2);
    const totalHeight = slotSize + (padding * 2);

    // Create transparent background rectangle
    const hotbarBg = this.scene.add.rectangle(0, 0, totalWidth, totalHeight, 0x333333, 0.5);
    this.hotbar.add(hotbarBg);

    // Create 9 slots (more opaque) inside the background
    for (let i = 0; i < totalSlots; i++) {
        const xPos = (i * (slotSize + slotSpacing)) - (totalWidth / 2) + padding + (slotSize / 2);
        const slot = this.scene.add.rectangle(xPos, 0, slotSize, slotSize, 0x555555, 0.9)
            .setStrokeStyle(2, 0x888888);
        this.hotbar.add(slot);

        // Store slot position for later use
        this.hotbarSlots.push({ x: xPos, y: 0 });

        // Initialize empty icon slot
        this.hotbarIcons.push(null);
    }

    this.hotbar.setPosition(hotbarX, hotbarY);
    this.hotbar.setScrollFactor(0);
    this.hotbar.setDepth(10000);

    this.elements.push(this.hotbar);
}

updateHotbar() {
    const inventory = this.scene.playerInventory.getInventory();

    // Update each hotbar slot
    for (let i = 0; i < 9; i++) {
        // Remove existing icon if any
        if (this.hotbarIcons[i]) {
            this.hotbarIcons[i].destroy();
            this.hotbarIcons[i] = null;
        }

        // Add new icon if item exists
        if (inventory[i] !== null) {
            const item = inventory[i];
            const slotPos = this.hotbarSlots[i];

            // Create item icon based on type
            let iconKey = 'plank'; // Default to plank for now
            if (item.type === 'plank') {
                iconKey = 'plank';
            }

            const icon = this.scene.add.image(slotPos.x, slotPos.y, iconKey)
                .setDisplaySize(40, 40); // Scale to fit in the slot

            this.hotbar.add(icon);
            this.hotbarIcons[i] = icon;
        }
    }
}

counteractZoom(zoomLevel) {
    //reverses zoom byt scaling and mooving UI elements inversely, temp solution, i cant get seperate UI and main layers rendered, breaks camera
    const inverseScale = 1 / zoomLevel;

    // Apply to all UI elements
    this.elements.forEach(element => {
        const original = this.originalPositions.get(element);
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


//------------------------------------------------------------------------------------------------------------------






toggleDebugMenu() {
    this.debugMenuVisible = !this.debugMenuVisible;
    this.givePlankButton.setVisible(this.debugMenuVisible);
}

}


