import GameManager from './game-manager.js';
import ShopUI from '../ui/shop-ui.js';
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

		// interaction
		this.promptElement = document.getElementById('interaction-prompt');
		this.releaseElement = document.getElementById('release-prompt');

		// debug
		this.fpsCounter = document.getElementById('fps-counter');
		this.modelCounter = document.getElementById('model-counter');
		this.shipStats = document.getElementById('ship-stats');
		this.positionElement = document.getElementById('position');
		this.shipPositionElement = document.getElementById('ship-position');
		this.playerStats = document.getElementById('player-stats');

		// game
		this.deathMessage = document.getElementById('death-screen');
		this.deathMessage.style.display = 'none';

		// left panel
		this.goldCounter = document.getElementById('gold-counter');

		this.currentInteractable = null;

		this.shopUI = new ShopUI(gameManager.network, gameManager);
		gameManager.on('openShop', () => this.shopUI.open());

		this.lastGold = null;
	}

	/**
	 * Refreshes all UI elements shown to the player with the latest data
	 */
	update() {
		const target = this.gameManager.closestInteractable;
		const player = this.gameManager.localPlayer;
		if (!player) return;

		this.updateGoldCounter(player.gold ?? 0);
		this.updateInteractionPrompts(player, target);
		this.updateDebugStats(player, target);
	}

	updateDebugStats(player, target) {
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

		const playerShip = this.gameManager.models.get(player.shipId);

		if (playerShip && !playerShip.isDead) {
			this.deathMessage.style.display = 'none';
		}

		this.positionElement.innerText = `Pos: x=${player.x}, y=${player.y}`;
		this.shipPositionElement.innerText = `Ship Pos: x=${playerShip.x}, y=${playerShip.y}`;
		this.playerStats.innerText = `
		Player Stats: gold=${player.gold}
		vx=${player.velocity.x}, vy=${player.velocity.y}, targetX=${player.target.x}, targetY=${player.target.y}, \n
		carrying? ${player.carryingId}, cannon? ${player.isUsingCannon}, steering? ${player.isSteering}, nearest entity: ${target?.entity.type}

		Ship Stats:
		vx=${playerShip.velocity.x}, vy=${playerShip.velocity.y}, targetX=${playerShip.target.x}, targetY=${playerShip.target.y}
		`;
	}

	updateInteractionPrompts(player, target) {
		let useText = null;
		let releaseText = null;
		const isInteracting = player.isSteering || player.isUsingCannon;

		if (isInteracting) {
			const prompt = target?.entity?.releasePrompt || 'Release';
			releaseText = `[Q] ${prompt}`;
		} else if (player.carryingId) {
			const carriedModel = this.gameManager.models.get(player.carryingId);
			if (carriedModel) {
				// @ts-ignore
				releaseText = `[Q] Drop ${carriedModel.type}`;
			}
		}

		if (target && !isInteracting) {
			useText = `[E] ${target.entity.usePrompt || 'Interact'}`;
		}

		if (this.gameManager.playerListDirty) {
			this.updatePlayersPanelDom(this.gameManager.allPlayers);
			this.gameManager.playerListDirty = false;
		}

		if (useText) {
			this.showPrompt(useText, this.promptElement);
		} else {
			this.hidePrompt(this.promptElement);
		}

		if (releaseText) {
			this.showPrompt(releaseText, this.releaseElement);
		} else {
			this.hidePrompt(this.releaseElement);
		}
	}

	showShipSunkMessage() {
		this.deathMessage.style.display = 'flex';
	}

	/**
	 * Hides the specified prompt
	 * @param {HTMLElement} htmlElement
	 */
	hidePrompt(htmlElement) {
		if (htmlElement.style.display !== 'none') {
			htmlElement.style.display = 'none';
		}
	}

	/**
	 * Shows an interaction prompt to the user
	 * @param {string} promptText the text to display
	 * @param {HTMLElement} htmlElement
	 */
	showPrompt(promptText, htmlElement) {
		if (htmlElement.textContent !== promptText) {
			htmlElement.textContent = promptText;
		}

		if (htmlElement.style.display !== 'block') {
			htmlElement.style.display = 'block';
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
		const sorted = [...allPlayers].sort((a, b) => (a.username || '').localeCompare(b.username || ''));
		list.innerHTML = sorted.map((p, i) => `<li>${i + 1}. ${p.username || 'Anonymous'}</li>`).join('');
	}

	updateGoldCounter(amount) {
		// if (!this.goldElement) return;
		// if (this.lastGold === amount) return;
		// this.goldElement.textContent = `Gold: ${amount}`;
		// this.lastGold = amount;
	}
}
