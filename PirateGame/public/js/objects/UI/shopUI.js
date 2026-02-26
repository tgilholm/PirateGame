import DomFactory from "./domFactory.js";

/**
 * ShopUI — builds and manages the shop overlay.
 *
 * Creates its own #shop-menu container and appends it to document.body.
 * Uses DomFactory to generate placeholder item cards.
 * Wire up onBuy callbacks when real shop logic is implemented.
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

    constructor() {
        // Build and mount own container — no #shop-menu needed in index.html
        this.menuEl = DomFactory.createElement("div", [], { id: "shop-menu" });
        this.menuEl.style.display = "none";
        document.body.appendChild(this.menuEl);
        this._build();
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Makes the shop overlay visible. */
    open() {
        this.menuEl.style.display = "block";
    }

    /** Hides the shop overlay. */
    close() {
        this.menuEl.style.display = "none";
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _build() {
        this.menuEl.innerHTML = "";

        // Title
        const title = DomFactory.createElement("h2", ["shop-title"]);
        title.textContent = "SHOP";
        this.menuEl.appendChild(title);

        // 6-item grid
        const grid = DomFactory.createElement("div", ["shop-grid"]);
        for (const item of ShopUI.ITEMS) {
            grid.appendChild(
                DomFactory.createCard(item.name, item.description, () => {
                    console.log(`[ShopUI] Clicked: ${item.name}`);
                })
            );
        }
        this.menuEl.appendChild(grid);

        // Close button
        this.menuEl.appendChild(
            DomFactory.createButton("Close", () => this.close(), ["shop-close-btn"])
        );
    }
}
