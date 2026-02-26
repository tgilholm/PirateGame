import CreateUI from "./createUI.js";

/**
 * ShopUI  builds and manages the shop overlay.
 *
 * Uses CreateUI to generate 6 placeholder item cards.
 * Items currently do nothing; wire up onBuy callbacks when
 * real shop logic is implemented.
 */
export default class ShopUI {

    // Placeholder items  replace with real data when the shop system is ready
    static ITEMS = [
        { name: "Item 1", description: "Placeholder item." },
        { name: "Item 2", description: "Placeholder item." },
        { name: "Item 3", description: "Placeholder item." },
        { name: "Item 4", description: "Placeholder item." },
        { name: "Item 5", description: "Placeholder item." },
        { name: "Item 6", description: "Placeholder item." },
    ];

    /**
     * @param {HTMLElement} menuEl - The #shop-menu container element
     */
    constructor(menuEl) {
        this.menuEl = menuEl;
        this._build();
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    open() {
        this.menuEl.style.display = "block";
    }

    close() {
        this.menuEl.style.display = "none";
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _build() {
        this.menuEl.innerHTML = "";

        // Title
        const title = CreateUI.createElement("h2", ["shop-title"]);
        title.textContent = "SHOP";
        this.menuEl.appendChild(title);

        // 6-item grid
        const grid = CreateUI.createElement("div", ["shop-grid"]);
        for (const item of ShopUI.ITEMS) {
            grid.appendChild(
                CreateUI.createCard(item.name, item.description, () => {
                    console.log(`[ShopUI] Clicked: ${item.name}`);
                })
            );
        }
        this.menuEl.appendChild(grid);

        // Close button
        this.menuEl.appendChild(
            CreateUI.createButton("Close", () => this.close(), ["shop-close-btn"])
        );
    }
}
