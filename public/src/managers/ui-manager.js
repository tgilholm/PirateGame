import GameManager from './game-manager.js';
import ShipModel from '../models/ship-model.js';
import Minimap from '../ui/minimap.js';
import ShopUI from '../ui/shop-ui.js';
import ShopModel from '../models/shop-model.js';
import PlayerModel from '../models/player-model.js';

/**
 * Owns all user interface concerns. All HTML/DOM logic should be routed
 * through this class.
 */
export default class UIManager {
	/**
	 * Constructs the UI manager for the specified Scene
	 * @param {Phaser.Scene} scene the scene to provide UI for
	 * @param {GameManager} gameManager to access the state of the game
	 * @param {Minimap} minimap
	 * @param {Phaser.Tilemaps.Tilemap} map
	 * @param {ShopUI} shopUI
	 * @param {boolean} showDebug whether or not to show the fps counter, model count etc
	 */
	constructor(scene, gameManager, minimap, map, shopUI, showDebug = false) {
		this.scene = scene;
		this.gameManager = gameManager;
		this.minimap = minimap;
		this.shopUI = shopUI;

		// interaction
		this.promptElement = document.getElementById('interaction-prompt');
		this.releaseElement = document.getElementById('release-prompt');

		// debug
		this.gameStats = document.querySelector('.game-stats');
		const display = showDebug ? 'block' : 'none';

		if (this.gameStats instanceof HTMLElement) {
			this.gameStats.style.display = display;
		}

		this.fpsCounter = document.getElementById('fps-counter');
		this.modelCounter = document.getElementById('model-counter');
		this.shipStats = document.getElementById('ship-stats');
		this.positionElement = document.getElementById('position');
		this.shipPositionElement = document.getElementById('ship-position');
		this.playerStats = document.getElementById('player-stats');

		// game
		this.deathMessage = document.getElementById('death-screen');
		this.deathMessage.style.display = 'none';

		// shop
		gameManager.on('openShop', () => this.shopUI.show());

		// left panel
		this.minimapContainer = document.getElementById('minimap-container');

		// right panel
		this.goldCounter = document.getElementById('gold-counter');
		this.goldCounter.style.display = 'flex';

		const settingsButton = document.getElementById('settings-button');
		if (settingsButton) settingsButton.style.display = 'block';

		this.currentInteractable = null;

		this.lastGold = null;

		const layers = [
			{ name: 'sea', colour: 0x83c8de }, // darker blue
			{ name: 'shallows', colour: 0xabe3f5 }, // light blue
			{ name: 'islands', colour: 0x29bb65 }, // green
		];

		this.setupMinimap(map, scene, layers);
	}

	async setupMinimap(map, scene, layers) {
		const mapSrc = await this.minimap.createMinimapImage(map, scene, layers);
		const minimapImage = document.getElementById('minimap');

		if (minimapImage) {
			//@ts-ignore
			minimapImage.src = mapSrc;
		}

		this.minimapContainer.style.display = 'flex'; // show
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
		this.updateMinimap(player);
		this.updateShopMenu(player);
		this.updateBoostBar(player);
	}

	/**
	 *
	 * @param {PlayerModel} player
	 */
	updateShopMenu(player) {
		// only hide if using
		if (!this.shopUI.isVisible) return;

		const closeToShop = Array.from(this.gameManager.interactables)
			.filter((item) => item instanceof ShopModel)
			.some((shop) => {
				return this.gameManager.getDistanceToInteractable(player, shop) < shop.interactRange;
			});

		if (!closeToShop) this.shopUI.hide();
	}

	updateMinimap(localPlayer) {
		if (!this.minimap) return;

		this.minimap.clear();

		// Draw shops
		this.gameManager.shopSpawns?.forEach((shop) => {
			this.minimap.drawCircle(shop.x, shop.y, '#f1c40f', 5);
		});

		// Draw ships
		this.gameManager.minimalShips.forEach((ship) => {
			this.minimap.drawAngledRect(ship.x, ship.y, 300, 60, ship.r, 'brown');
		});

		// Draw NPCs
		this.gameManager.minimalNPCs.forEach((npc) => {
			this.minimap.drawCircle(npc.x, npc.y, 'blue', 2);
		});

		// Draw players
		this.gameManager.minimalPlayers.forEach((player) => {
			if (player.id === localPlayer.id) {
				this.minimap.drawPlayerMarker(player.x, player.y, 40, this.gameManager.pirateColour);
			} else {
				this.minimap.drawCircle(player.x, player.y, 'red', 3);
			}
		});

		this.gameManager.minimalShops.forEach((shop) => {
			this.minimap.drawCircle(shop.x, shop.y, 'gold', 6);
		});
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

	updateBoostBar(player) {
		if (!this.boostBar) {
			this.boostBar = document.getElementById('boost-bar-container');
			this.boostFill = document.getElementById('boost-bar-fill');
		}

		const ship = this.gameManager.models.get(player.shipId);
		if (!ship || !player.isSteering) {
			this.boostBar.style.display = 'none';
			return;
		}

		this.boostBar.style.display = 'block';
		const pct = ship.boostCooldownTime > 0 ? 100 * (1 - (ship.boostCooldown ?? 0) / ship.boostCooldownTime) : 100;
		this.boostFill.style.width = `${pct}%`;
		this.boostFill.style.background = ship.isBoosting ? '#ffaa00' : '#00aaff';
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
			this.updatePlayersPanelDom(this.gameManager.minimalPlayers);
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
		if (!this.goldCounter) return;
		if (this.lastGold === amount) return;
		this.goldCounter.textContent = `Gold: ${amount}`;
		this.lastGold = amount;
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
}
