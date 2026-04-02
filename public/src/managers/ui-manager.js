import GameManager from './game-manager.js';
import Minimap from '../ui/minimap.js';
import ShopUI from '../ui/shop-ui.js';
import GoldCounter from '../ui/gold-counter.js';
import ShipModel from '../models/ship-model.js';

/**
 * Owns all user interface concerns. All HTML/DOM logic should be routed
 * through this class.
 */
export default class UIManager {
	/**
	 * Constructs the UI manager for the specified Scene
	 * @param {Phaser.Scene} scene the scene to provide UI for
	 * @param {GameManager} gameManager to access the state of the game
	 */
	constructor(scene, gameManager) {
		this.scene = scene;
		this.gameManager = gameManager;

		this.promptElement = document.getElementById('interaction-prompt');
		this.fpsCounter = document.getElementById('fps-counter');
		this.modelCounter = document.getElementById('model-counter');
		this.shipStats = document.getElementById('ship-stats');
		this.menu = document.getElementById('left-panel');
		this.deathMessage = document.getElementById('death-screen');

		this.deathMessage.style.display = 'block';
		this.menu.style.display = 'block';
		this.currentInteractable = null;

		this.minimap = new Minimap(document.getElementById('minimap-container'));
		this.minimapReady = false;

		this.shopUI = new ShopUI(gameManager.network, gameManager);
		gameManager.on('openShop', () => this.shopUI.open());

		this.goldCounter = new GoldCounter(document.getElementById('gold-counter'));

		gameManager.on('localPlayerReady', (player) => {
			const pos = player.worldPos;
			this.minimap.placeMarker(pos.x, pos.y, gameManager.mapWidth, gameManager.mapHeight);
			this.minimap.placeShops(
				gameManager.mapWidth,
				gameManager.mapHeight,
				gameManager.shopSpawns
			);
			this.minimapReady = true;
			this.goldCounter.show();
		});
		this.goldElement = document.getElementById('gold-counter');
		this.lastGold = null;
	}

	/**
	 * Refreshes all UI elements shown to the player with the latest data
	 */
	update() {
		const target = this.gameManager.closestInteractable;
		const player = this.gameManager.localPlayer;

		if (!player) return;

		this.goldCounter.update(player);

		this.updateGoldCounter(player.gold ?? 0);
		const isInteracting = player.isSteering || player.isUsingCannon;

		if (target) {
			const item = target.entity;

			if (isInteracting) {
				const prompt = item.releasePrompt || 'Release';
				this.showPrompt('[Q]' + prompt);
			} else {
				this.showPrompt('[E]' + item.usePrompt);
			}
		} else {
			if (isInteracting) {
				this.showPrompt('[Q] Release');
			} else {
				this.hidePrompt();
			}
		}

		if (this.gameManager.playerListDirty) {
			this.updatePlayersPanelDom(this.gameManager.allPlayers);
			this.gameManager.playerListDirty = false;
		}

		if (this.minimapReady) {
			const pos = this.gameManager.localPlayer.worldPos;
			this.minimap.updateMarker(pos.x, pos.y);
		}
		this.fpsCounter.innerText = `FPS: ${Math.floor(this.scene.game.loop.actualFps)}`;
		this.modelCounter.innerText = `Nearby Models: ${this.gameManager.models.size}`;

		const ship = this.gameManager.models.get(player.parentId);

		this.shipStats.style.display = 'flex';
		if (ship && ship instanceof ShipModel) {
			this.shipStats.innerText = `Local Ship: ${ship.id};
			Sail State: ${ship.sailState}
			Turn Angle: ${ship.turnAngle}
			Anchored: ${ship.anchored}
			`;

			// Smoothly update zoom to new value
			const targetZoom = 0.8 - ship.sailState * (0.8 - 0.6);
			const cam = this.scene.cameras.main;
			cam.zoom += (targetZoom - cam.zoom) * 0.05;
		} else {
			this.shipStats.innerText = `Not on a ship`;
			this.scene.cameras.main.zoomTo(0.8); // default off ship
		}
	}

	showDeathMessage() {
		this.deathMessage.style.display = 'block';
		console.log('shown death message');
	}

	/**
	 * Removes the interaction prompt from the users screen if it is being shown
	 */
	hidePrompt() {
		if (this.promptElement.style.display !== 'none') {
			this.promptElement.style.display = 'none';
		}
	}

	/**
	 * Shows an interaction prompt to the user
	 * @param {string} promptText the text to display
	 */
	showPrompt(promptText) {
		if (this.promptElement.textContent !== promptText) {
			this.promptElement.textContent = promptText;
		}

		if (this.promptElement.style.display !== 'block') {
			this.promptElement.style.display = 'block';
		}
	}

	/**
	 * Takes a list of players and refreshes the "active player" list
	 * @param {Object} allPlayers the list of players
	 */
	updatePlayersPanelDom(allPlayers) {
		const panel = document.getElementById('players-panel');
		const list = document.getElementById('players-list');
		if (!panel || !list) return;
		panel.style.display = 'block';
		const sorted = [...allPlayers].sort((a, b) =>
			(a.username || '').localeCompare(b.username || '')
		);
		list.innerHTML = sorted
			.map((p, i) => `<li>${i + 1}. ${p.username || 'Anonymous'}</li>`)
			.join('');
	}

	updateGoldCounter(amount) {
		if (!this.goldElement) return;
		if (this.lastGold === amount) return;

		this.goldElement.textContent = `Gold: ${amount}`;
		this.lastGold = amount;
	}
}
