import DomFactory from "./dom-factory.js";

//builds and manages the shop overlay, uses DomFactory to generate placeholder item cards
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
        this.menuEl = document.getElementById("shop-menu");
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
        title.textContent = "shop";
        this.menuEl.appendChild(title);

        //6-item grid
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
