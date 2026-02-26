/**
 * CreateUI — generic static DOM factory.
 * Provides reusable helpers for building UI elements.
 * Any UI class (DebugMenu, ShopUI, etc.) can call these methods
 * instead of manually constructing DOM nodes.
 */
export default class CreateUI {

    /**
     * Creates a DOM element with optional CSS classes and HTML attributes.
     * @param {string} tag - Element tag name (e.g. "div", "button", "span")
     * @param {string[]} [classes] - CSS class names to add
     * @param {Object} [attrs] - Key/value pairs set as HTML attributes
     * @returns {HTMLElement}
     */
    static createElement(tag, classes = [], attrs = {}) {
        const el = document.createElement(tag);
        if (classes.length) el.classList.add(...classes);
        for (const [key, val] of Object.entries(attrs)) {
            el.setAttribute(key, val);
        }
        return el;
    }

    /**
     * Creates a styled button element.
     * @param {string} label - Button text content
     * @param {Function} onClick - Click event handler
     * @param {string[]} [extraClasses] - Additional CSS classes to add
     * @returns {HTMLButtonElement}
     */
    static createButton(label, onClick, extraClasses = []) {
        const btn = /** @type {HTMLButtonElement} */ (CreateUI.createElement("button", extraClasses));
        btn.textContent = label;
        btn.addEventListener("click", onClick);
        return btn;
    }

    /**
     * Creates and appends the minimap <img> and <canvas> into a container element.
     * Returns references to both so the caller can use them directly.
     *
     * @param {HTMLElement} containerEl - The element to populate (e.g. #minimap-container)
     * @param {string} imgSrc - src attribute for the map image
     * @returns {{ img: HTMLImageElement, canvas: HTMLCanvasElement }}
     */
    static createMinimapContent(containerEl, imgSrc) {
        containerEl.innerHTML = "";

        const img = /** @type {HTMLImageElement} */ (CreateUI.createElement("img", ["minimap-img"]));
        img.src = imgSrc;
        containerEl.appendChild(img);

        const canvas = /** @type {HTMLCanvasElement} */ (CreateUI.createElement("canvas", ["minimap-marker-canvas"]));
        containerEl.appendChild(canvas);

        return { img, canvas };
    }

    /**
     * Creates a shop item card.
     *   <div class="shop-card">
     *     <span class="shop-card-name">Name</span>
     *     <p class="shop-card-description">Description</p>
     *     <button class="shop-card-buy">Buy</button>
     *   </div>
     *
     * @param {string} name - Item name
     * @param {string} description - Short item description
     * @param {Function} onBuy - Called when the buy button is clicked
     * @returns {HTMLElement}
     */
    static createCard(name, description, onBuy) {
        const card = CreateUI.createElement("div", ["shop-card"]);

        const nameEl = CreateUI.createElement("span", ["shop-card-name"]);
        nameEl.textContent = name;
        card.appendChild(nameEl);

        const descEl = CreateUI.createElement("p", ["shop-card-description"]);
        descEl.textContent = description;
        card.appendChild(descEl);

        card.appendChild(CreateUI.createButton("Buy", onBuy, ["shop-card-buy"]));

        return card;
    }

    /**
     * Creates a labelled section with a row of buttons.
     *   <div class="debug-section" data-component-key="">
     *     <span class="debug-label">Label</span>
     *     <div class="debug-buttons">...buttons...</div>
     *   </div>
     *
     * @param {string} labelText
     * @param {{ label: string, onClick: Function }[]} buttons
     * @returns {HTMLElement}
     */
    static createSection(labelText, buttons) {
        const section = CreateUI.createElement("div", ["debug-section"]);

        const label = CreateUI.createElement("span", ["debug-label"]);
        label.textContent = labelText;
        section.appendChild(label);

        const btnContainer = CreateUI.createElement("div", ["debug-buttons"]);
        for (const { label: btnLabel, onClick } of buttons) {
            btnContainer.appendChild(CreateUI.createButton(btnLabel, onClick));
        }
        section.appendChild(btnContainer);

        return section;
    }

    /**
     * Builds and appends the debug menu DOM to the given container.
     * Returns references to the key elements for wiring up by DebugMenu.
     *
     * @param {HTMLElement} [container=document.body]
     * @returns {{ menu, statsSection, statsBtn, statsOverlay, statsContent }}
     */
    static createDebugMenuDOM(container = document.body) {
        const menu = CreateUI.createElement("div", [], { id: "debug-menu" });
        menu.style.display = "none";

        const heading = CreateUI.createElement("h3");
        heading.textContent = "Debug Menu";
        menu.appendChild(heading);

        const statsSection = CreateUI.createElement("div", ["debug-section"]);
        statsSection.style.marginTop = "8px";

        const statsBtn = /** @type {HTMLButtonElement} */ (
            CreateUI.createElement("button", [], { id: "printStatsButton" })
        );
        statsBtn.textContent = "Print Ship Stats";
        statsSection.appendChild(statsBtn);
        menu.appendChild(statsSection);

        const statsOverlay = CreateUI.createElement("div", [], { id: "stats-overlay" });
        const overlayHeading = CreateUI.createElement("h3");
        overlayHeading.textContent = "Ship Stats";
        statsOverlay.appendChild(overlayHeading);

        const statsContent = CreateUI.createElement("div", [], { id: "stats-content" });
        statsOverlay.appendChild(statsContent);

        container.appendChild(menu);
        container.appendChild(statsOverlay);

        return { menu, statsSection, statsBtn, statsOverlay, statsContent };
    }
}
