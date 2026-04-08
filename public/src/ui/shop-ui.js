import GameManager from '../managers/game-manager.js';

export default class ShopUI {
	/**
	 *
	 * @param {GameManager} gameManager
	 * @param {UpgradeConfig} upgradeConfig
	 * @param {(name: string) => void} buyCallback
	 */
	constructor(gameManager, upgradeConfig, buyCallback) {
		this.buyCallback = buyCallback;
		this.gameManager = gameManager;
		this.shopMenu = document.getElementById('shop-menu');
		this.template = document.querySelector('.shop-card-template');
		this.grid = document.querySelector('.shop-grid');
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
		const root = clone.querySelector('.shop-card');
		const isMax = currentLevel >= 8;
		const nextIndex = currentLevel;

		root.querySelector('.shop-card-name').textContent = config.name;
		root.querySelector('.shop-card-level').textContent = `Level: ${currentLevel} / 8`;

		const buyButton = root.querySelector('.shop-card-buy');
		const costElement = root.querySelector('.shop-card-cost');
		const benefitElement = root.querySelector('.shop-card-benefit');
		const cost = config.costs[nextIndex];
		const multiplier = config.multipliers[nextIndex];

		buyButton.addEventListener('click', () => {
			const localPlayer = this.gameManager.localPlayer;

			// check gold before sending
			if (localPlayer.gold >= cost) {
				this.buyCallback?.(key);
			} else {
				this.flashError(buyButton);
			}
		});

		// non-authoritative checking to avoid spamming the server
		if (isMax) {
			buyButton.textContent = 'Maximum';
			buyButton.disabled = true;
			costElement.textContent = '---';
		} else {
			// Display cost of next level
			costElement.textContent = `${cost.toString()} Gold`;

			// show a percentage benefit of next level
			const benefit = Math.round((multiplier - 1) * 100);
			benefitElement.textContent = `Next Level: ${currentLevel + 1} (${benefit > 0 ? '+' : ''}${benefit}%)`;
		}

		return clone;
	}

	flashError(element) {
		element.style.color = 'red';
		setTimeout(() => (element.style.color = ''), 500);
	}
}
