import GameManager from '../managers/game-manager';

export default class ShopUI extends Phaser.Events.EventEmitter {
	/**
	 *
	 * @param {GameManager} gameManager
	 * @param {UpgradeConfig} upgradeConfig
	 */
	constructor(gameManager, upgradeConfig) {
		super();
		this.gameManager = gameManager;
		this.shopMenu = document.getElementById('shop-menu');
		this.template = document.getElementById('shop-card-template');
		this.grid = document.querySelector('shop-grid');
		this.upgradeConfig = upgradeConfig;

		const closeButton = document.getElementById('shop-close-button');
		closeButton.addEventListener('click', () => {
			this.shopMenu.style.display = 'none';
		});

		// Only update shop if actually inside it
		this.gameManager.on('localShipUpdated', () => {
			if (this.isVisible) this.refresh();
		});
	}

	get isVisible() {
		return this.shopMenu.style.display !== 'none';
	}

	show() {
		this.shopMenu.style.display = 'block';
		this.refresh();
	}

	hide() {
		this.shopMenu.style.display = 'none';
	}

	refresh() {
		const currentLevels = this.gameManager.getLocalShipUpgrades() || {};
		this.grid.innerHTML = ''; // reset- trusted string, innerHTML is safe here

		for (const [key, data] of Object.entries(this.upgradeConfig)) {
			const level = currentLevels[key] || 1;
			const card = this.createCard(key, data, level);
			this.grid.appendChild(card);
		}
	}

	createCard(key, config, currentLevel) {
		// create a copy of the template
		if (!(this.template instanceof HTMLTemplateElement)) return null;
		const clone = this.template.content.cloneNode(true);

		//@ts-ignore
		const root = clone.getElementById('shop-card');
	}
}
