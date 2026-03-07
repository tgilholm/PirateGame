import DomFactory from "./dom-factory.js";

// Static component catalogue — one entry per types.json component
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

const LEVEL_PROGRESSION = ['LVL1', 'LVL2', 'LVL3'];

//builds and manages shop overlay
export default class ShopUI {
    /**
     * @param {import('../managers/network-manager.js').default} network
     * @param {import('../managers/game-manager.js').default} gameManager
     */
    constructor(network, gameManager) {
        this.network = network;
        this.gameManager = gameManager;
        this.menuEl = document.getElementById("shop-menu");
        this.build(null);
    }

    //,akes the shop overlay visible
    open() {
        const components = this.gameManager.getLocalShipComponents();
        this.build(components);
        this.menuEl.style.display = "block";
    }

    //hides shop overlay
    close() {
        this.menuEl.style.display = "none";
    }

    /**
     * rebuilds the shop DOM. refresh after buying an upgrade
     * @param {Record<string, string> | null} components - current variant per component slot
     */
    build(components) {
        this.menuEl.innerHTML = "";

        const title = DomFactory.createElement("h2", ["shop-title"]);
        title.textContent = "Ship Upgrades";
        this.menuEl.appendChild(title);

        const grid = DomFactory.createElement("div", ["shop-grid"]);

        for (const comp of COMPONENTS) {
            const current = components?.[comp.key] ?? null;
            const currentIdx = current ? LEVEL_PROGRESSION.indexOf(current) : -1;
            const isMax = currentIdx >= LEVEL_PROGRESSION.length - 1;
            const nextLevel = (!isMax && currentIdx >= 0) ? LEVEL_PROGRESSION[currentIdx + 1] : null;

            const card = DomFactory.createElement("div", ["shop-card"]);

            const nameEl = DomFactory.createElement("span", ["shop-card-name"]);//name of component type
            nameEl.textContent = comp.name;
            card.appendChild(nameEl);

            const descEl = DomFactory.createElement("p", ["shop-card-description"]); //description of component type
            descEl.textContent = comp.description;
            card.appendChild(descEl);

            const levelEl = DomFactory.createElement("span", ["shop-card-level"]); //current level of component
            levelEl.textContent = current ? "Level: " + current : "Level: -";
            card.appendChild(levelEl);

            if (isMax) {
                const maxBtn = DomFactory.createButton("MAX", () => {}, ["shop-card-buy", "shop-card-max"]); //disables when lvl = max
                maxBtn.disabled = true;
                card.appendChild(maxBtn);
            } else {
                const label = nextLevel ? "Buy > " + nextLevel : "Buy";
                const buyBtn = DomFactory.createButton(label, () => {
                    this.network.sendUpgrade(comp.key);
                    setTimeout(() => this.build(this.gameManager.getLocalShipComponents()), 75);
                }, ["shop-card-buy"]);
                card.appendChild(buyBtn);
            }

            grid.appendChild(card);
        }

        this.menuEl.appendChild(grid);

        this.menuEl.appendChild(DomFactory.createButton("Close", () => this.close(), ["shop-close-btn"])
        );
    }
}

