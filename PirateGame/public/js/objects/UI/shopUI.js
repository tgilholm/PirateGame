import DomFactory from "./domFactory.js";

//builds and manages shop overlay, creates #shop-menu container and appends to document.body, uses DomFactory to generate item cards
export default class ShopUI {

    //placeholder items  replace with real data when the shop system is ready
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
        this.build();
    }

    //makes the shop overlay visible
    open() {
        this.menuEl.style.display = "block";
    }

    //hides the shop overlay
    close() {
        this.menuEl.style.display = "none";
    }

    build() {
        this.menuEl.innerHTML = "";

        //title
        const title = DomFactory.createElement("h2", ["shop-title"]);
        title.textContent = "SHOP";
        this.menuEl.appendChild(title);

        //6-item grid)
        const grid = DomFactory.createElement("div", ["shop-grid"]);
        for (const item of ShopUI.ITEMS) {
            grid.appendChild(
                DomFactory.createCard(item.name, item.description, () => {
                    console.log(`[ShopUI] Clicked: ${item.name}`);
                })
            );
        }
        this.menuEl.appendChild(grid);

        //close button
        this.menuEl.appendChild(
            DomFactory.createButton("Close", () => this.close(), ["shop-close-btn"])
        );
    }
}
