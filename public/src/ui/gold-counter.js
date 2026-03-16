import DomFactory from "./dom-factory.js";
import uiConfig from "./ui-config.json" with { type: "json" };

//builds and manages gold display, Shows gold amount and updates
export default class GoldCounter {

    /**
     * @param {HTMLElement} containerEl - The #gold-counter element to populate
     */
    constructor(containerEl) {
        this.container = containerEl;
        this.amountEl = null;
        this.build();
        this.applyPosition();
    }

    //Creates the amount element
    build() {
        this.container.innerHTML = "";

        this.amountEl = DomFactory.createElement("span", ["gold-counter-amount"]);
        this.amountEl.textContent = "0";
        this.container.appendChild(this.amountEl);
    }

    //moves the container to area set in ui-config
    applyPosition() {
        const pos = uiConfig.goldCounter.Position;
        this.container.style.top = pos.Top;
        this.container.style.bottom = pos.Bottom;
        this.container.style.left = pos.Left;
        this.container.style.right = pos.Right;
    }

    /**
     * reads gold from player and updates display
     * @param {import('../models/player-model.js').default} player
     */
    update(player) {
        if (this.amountEl && player && player.gold != null) {
            this.amountEl.textContent = player.gold.toLocaleString();
        }
    }

    //Shows the counter
    show() {
        this.container.style.display = "flex";
    }

    //hides the counter
    hide() {
        this.container.style.display = "none";
    }
}
