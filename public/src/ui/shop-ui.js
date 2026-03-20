import DomFactory from './dom-factory.js';

//component catalogue
const COMPONENTS = [
	{ key: 'sails', name: 'Sails', description: 'Acceleration and max speed' },
	{ key: 'cannons', name: 'Cannons', description: 'Damage, range and cannon count' },
	{ key: 'head', name: 'Head', description: 'Ramming power' },
	{ key: 'body', name: 'Body', description: 'Max HP and crew capacity' },
	{ key: 'crowsNest', name: "Crow's Nest", description: 'Minimap range and vision' },
	{ key: 'anchor', name: 'Anchor', description: 'Stop power and deploy time' },
	{ key: 'rudder', name: 'Rudder', description: 'Turn speed and responsiveness' },
	{ key: 'crew', name: 'Crew', description: 'Fire rate and cannon accuracy' },
];

const level_progression = ['LVL1', 'LVL2', 'LVL3'];

//get component cost data from json
let componentsData = null;
fetch('/jsons/components.json')
	.then((r) => r.json())
	.then((data) => {
		componentsData = data.components;
	})
	.catch(() => {}); //

//builds and manages shop overlay
export default class ShopUI {
	/**
	 * @param {import('../managers/network-manager.js').default} network
	 * @param {import('../managers/game-manager.js').default} gameManager
	 */
	constructor(network, gameManager) {
		this.network = network;
		this.gameManager = gameManager;
		this.goldCounter = null;
		this.menuEl = document.getElementById('shop-menu');
		this.gridEl = null;
		this.lastComponents = null;

		this.initLayout();

		//rebuilds the shop grid
		this.gameManager.on('localShipUpdated', () => {
			if (this.menuEl.style.display === 'block') {
				const comps = this.gameManager.getLocalShipComponents();
				if (comps && JSON.stringify(comps) !== JSON.stringify(this.lastComponents)) {
					this.build(comps);
				}
			}
		});
	}

	//initialises the shop layout
	initLayout() {
		this.menuEl.innerHTML = '';

		const title = DomFactory.createElement('h2', ['shop-title']);
		title.textContent = 'Ship Upgrades';
		this.menuEl.appendChild(title);

		this.gridEl = DomFactory.createElement('div', ['shop-grid']);
		this.menuEl.appendChild(this.gridEl);

		this.menuEl.appendChild(
			DomFactory.createButton('Close', () => this.close(), ['shop-close-btn'])
		);
	}

	//makes the shop overlay visible
	open() {
		this.lastComponents = null; // force rebuild on open
		const comps = this.gameManager.getLocalShipComponents();
		this.build(comps);
		this.menuEl.style.display = 'block';
	}

	//hides shop overlay
	close() {
		this.menuEl.style.display = 'none';
	}

	/**
	 * rebuilds the shop grid. refresh after buying an upgrade or opening the shop
	 * @param {Record<string, string> | null} components - current variant per component slot
	 */
	build(components) {
		console.log('[ShopUI] rebuilding shop');
		this.lastComponents = components ? { ...components } : null;
		this.gridEl.innerHTML = '';

		for (const comp of COMPONENTS) {
			const current = components?.[comp.key] ?? null;
			const currentIdx = current ? level_progression.indexOf(current) : -1;
			const isMax = currentIdx >= level_progression.length - 1;
			const nextLevel = !isMax && currentIdx >= 0 ? level_progression[currentIdx + 1] : null;

			const card = DomFactory.createElement('div', ['shop-card']);

			const nameEl = DomFactory.createElement('span', ['shop-card-name']); //name of component type
			nameEl.textContent = comp.name;
			card.appendChild(nameEl);

			const descEl = DomFactory.createElement('p', ['shop-card-description']); //description of component type
			descEl.textContent = comp.description;
			card.appendChild(descEl);

			const levelEl = DomFactory.createElement('span', ['shop-card-level']); //current level of component
			levelEl.textContent = current ? 'Level: ' + current : 'Level: -';
			card.appendChild(levelEl);

			const bottomRow = DomFactory.createElement('div', ['shop-card-bottom-row']); //container for cost and buy button

			if (isMax) {
				const maxBtn = DomFactory.createButton('MAX', () => {}, [
					'shop-card-buy',
					'shop-card-max',
				]); //disables when lvl = max
				maxBtn.disabled = true;
				bottomRow.appendChild(maxBtn);
			} else {
				//cost label
				const cost = nextLevel
					? componentsData?.[comp.key]?.variants?.[nextLevel]?.cost
					: null;
				const costEl = DomFactory.createElement('span', ['shop-card-cost']);
				costEl.textContent = cost != null ? cost.toLocaleString() + 'g' : '';
				bottomRow.appendChild(costEl);

				const label = nextLevel ? 'Buy > ' + nextLevel : 'Buy';
				const buyBtn = DomFactory.createButton(label, () => {
					console.log('[ShopUI] Buy clicked: ' + comp.key + ' next=' + nextLevel);
					this.network.sendUpgrade(comp.key);
				}, ['shop-card-buy']);
				bottomRow.appendChild(buyBtn);
			}

			card.appendChild(bottomRow);
			this.gridEl.appendChild(card);
		}
	}
}
