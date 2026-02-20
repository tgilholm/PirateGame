export default class UI {
    constructor(scene) {
        if (UI.instance) return UI.instance;
        UI.instance = this;

        this.scene = scene;
        this.debugMenuVisible = false;

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

        this.createDebugControls();
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