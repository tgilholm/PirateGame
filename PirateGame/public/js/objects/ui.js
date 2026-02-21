export default class UI {
    constructor(scene) { //singleton class constructs UI elements 
        if (UI.instance) return UI.instance;
        UI.instance = this;

        this.scene = scene;
        this.debugMenuVisible = false;

        // Map dimensions
        let minimapScale = 0.2; //minimap scale

        // Top message text 
        this.messageText = scene.add.text(
            scene.cameras.main.width / 2,
            20,
            '',
            {
                fontSize: '18px',
                fill: '#ffffff',
                backgroundColor: '#00000088'
            }
        )
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(1000)
        .setVisible(false);

        // Minimap
        this.minimap = scene.add.image(10, 10, 'minimap')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1000)
            .setScale(minimapScale);

        // creates player marker on minimap
        this.playerMarker = scene.add.circle(0, 0, 5, 0xff0000)
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        this.createDebugControls();
    }

    initializeMarker(spawnX, spawnY, mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.updatePlayerMarker(spawnX, spawnY, mapWidth, mapHeight);
    }

    updatePlayerMarker(playerX, playerY, mapWidth, mapHeight) { //Scale player position to minimap coordinates
        const minimapWidth = this.minimap.displayWidth;
        const minimapHeight = this.minimap.displayHeight;
        const minimapX = this.minimap.x;
        const minimapY = this.minimap.y;
        
        const markerX = minimapX + (playerX / mapWidth) * minimapWidth;
        const markerY = minimapY + (playerY / mapHeight) * minimapHeight;
        
        this.playerMarker.setPosition(markerX, markerY);
    }

    showMessage(message) {
        this.messageText.setText(message);
        this.messageText.setVisible(true);
    }

    hideMessage(message) {
        if (!message || this.messageText.text === message) {
            this.messageText.setVisible(false);
        }
    }

    //connects keyboard button (X) to HTML logic
    createDebugControls() {
        this.printStatsButton = document.getElementById('printStatsButton');

        if (this.printStatsButton) {
            this.printStatsButton.addEventListener('click', async () => {
                const stats = await this.fetchShipStats();
                if (stats) console.log('=== SHIP STATS ===', stats);
            });
        }

        // X key toggles debug menu
        this.debugKey = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.X
        );

        this.debugKey.on('down', () => this.toggleDebugMenu());

        this.scene.events.once('shutdown', () => {
            this.debugKey?.off('down');
            this.debugKey = null;
        });
    }

    //shows or hides debug menue HTML buttons
    toggleDebugMenu() {
        this.debugMenuVisible = !this.debugMenuVisible;

        if (this.printStatsButton) {
            this.printStatsButton.style.display =
                this.debugMenuVisible ? 'block' : 'none';
        }
    }

    //API
    async fetchShipStats() {
        try {
            const res = await fetch('/api/stats');
            if (!res.ok) throw new Error(res.status);
            return await res.json();
        } catch (e) {
            console.error('Failed to fetch ship stats:', e);
            return null;
        }
    }
}