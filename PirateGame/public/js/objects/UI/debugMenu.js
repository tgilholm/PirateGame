import DomFactory from "./domFactory.js";
import UI_CONFIG from "./UIConfig.json" with { type: "json" };

//has debug panel logic/DOM creation. adding/removing components/variants in types.json automatically updates the menu
export default class DebugMenu {

    /**
     * @param {Phaser.Scene} scene - active scene
     * @param {Function} [onComponentChange] - (componentType: string, variant: string, updatedStats: Object|null) => void
     */
    constructor(scene, onComponentChange = null) {
        this.scene = scene;
        this.onComponentChange = onComponentChange;
        this.menuVisible = false;
        this.statsVisible = false;
        this.types = null; //populated in init()

        //builds DOM elements via CreateUI
        const { menu, statsSection, statsBtn, statsOverlay, statsContent } =
            DomFactory.createDebugMenuDOM();

        this.menuEl = menu;
        this.statsSection = statsSection; //component sections are inserted before this
        this.statsBtn = statsBtn;
        this.statsOverlay = statsOverlay;
        this.statsContent = statsContent;

        this.wireevents();
    }

   
    //fetches component types from /api/types and populates the menu with one button-row per component
    async init() {
        let types;
        try {
            const res = await fetch("/api/types");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            types = await res.json();
        } catch (e) {
            console.error("[DebugMenu] Failed to fetch component types:", e);
            return;
        }

        this.types = types;

        for (const [componentKey, componentData] of Object.entries(types.components)) {
            const buttons = Object.keys(componentData.variants).map(variant => ({
                label: variant,
                onClick: () => this.applyComponent(componentKey, variant)
            }));

            const section = DomFactory.createSection(componentData.name, buttons);
            section.dataset.componentKey = componentKey;

            //always keep the stats button at the bottom
            this.menuEl.insertBefore(section, this.statsSection);
        }

        //keep window.setComponent wired for console/external callers
        window.setComponent = (componentType, variant) =>
            this.applyComponent(componentType, variant);
    }

    //Shows or hides the debug menu panel
    toggle() {
        this.menuVisible = !this.menuVisible;
        this.menuEl.style.display = this.menuVisible ? "block" : "none";
    }


    
    wireevents() {
        // Print-stats button
        this.statsBtn.addEventListener("click", async () => {
            const stats = await this.fetchShipStats();
            if (stats) {
                console.log("=== SHIP STATS ===", stats);
                this.toggleStatsOverlay(stats);
            }
        });

        // X key toggles the debug menu
        this.debugKey = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes[UI_CONFIG.DEBUG_MENU.TOGGLE_KEY]
        );
        this.debugKey.on("down", () => this.toggle());

        //clean up on scene shutdown
        this.scene.events.once("shutdown", () => {
            this.debugKey?.off("down");
            this.debugKey = null;
        });
    }






    /**
     * POSTs chosen component variant to the server, highlights the button and runs onComponentChange with returned stats
     * @param {string} componentType - key (e.g. "hull", "sails")
     * @param {string} variant - variant name to apply (e.g. "LVL1", "kraken")
     */
    async applyComponent(componentType, variant) {
        try {
            const res = await fetch("/api/component", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ componentType, variant }) 
            });

            this.highlightButton(componentType, variant);

            const updatedStats = res.ok ? await res.json() : null;

            //refresh overlay if it is open
            if (this.statsVisible && updatedStats) {
                this.updateStatsOverlay(updatedStats);
            }

            //notify any external listener
            if (this.onComponentChange) {
                this.onComponentChange(componentType, variant, updatedStats);
            }
        } catch (e) {
            console.error("[DebugMenu] Failed to apply component:", e);
        }
    }

    /**
     * Marks the chosen variant button as active and clears the others in that row
     * @param {string} componentType - key of the component section to update
     * @param {string} variant - variant name whose button should be marked active
     */
    highlightButton(componentType, variant) {
        this.menuEl.querySelectorAll(".debug-section[data-component-key]").forEach(section => {
            if (section.dataset.componentKey === componentType) {
                section.querySelectorAll("button").forEach(btn => {
                    btn.classList.toggle("active", btn.textContent === variant);
                });
            }
        });
    }

    /**
     * toggles the stats overlay panel. Opens and populates on first call; hides on second
     * @param {Object} stats - key/value ship stat data returned from /api/stats
     */
    toggleStatsOverlay(stats) {
        if (this.statsVisible) {
            this.statsOverlay.style.display = "none";
            this.statsVisible = false;
            return;
        }
        this.updateStatsOverlay(stats);
        this.statsOverlay.style.display = "block";
        this.statsVisible = true;
    }

    /**
     * derives ordered, deduplicated stat keys from types.components[*].affects.
     * falls back to Object.keys(stats) if types haven't loaded yet.
     * @returns {string[]}
     */
    getStatKeys(stats) {
        const seen = new Set();
        const keys = [];
        if (this.types?.components) {
            for (const componentData of Object.values(this.types.components)) {
                for (const key of (componentData.affects ?? [])) {
                    if (!seen.has(key)) { seen.add(key); keys.push(key); }
                }
            }
        }
        //fall back to whatever the server returned if types not loaded
        for (const key of Object.keys(stats)) {
            if (!seen.has(key)) { seen.add(key); keys.push(key); }
        }
        return keys;
    }

    /**
     * camelCase -> "Title Case" label, e.g. "cannonDamage" -> "Cannon Damage"
     * @param {string} key
     * @returns {string}
     */
    camelToTitle(key) {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, c => c.toUpperCase());
    }

    /**
     * rebuilds the stats overlay content from the provided stats object
     * @param {Object} stats - key/value ship stat data to display
     */
    updateStatsOverlay(stats) {
        const keys = this.getStatKeys(stats);

        this.statsContent.innerHTML = keys
            .map(key => {
                const raw = stats[key];
                const display = (typeof raw === "number")
                    ? parseFloat(raw.toPrecision(6))
                    : (raw ?? "N/A");
                return `
                <div class="stat-row">
                    <span class="stat-label">${this.camelToTitle(key)}</span>
                    <span class="stat-value">${display}</span>
                </div>`;
            })
            .join("");
    }

    async fetchShipStats() {
        try {
            const res = await fetch("/api/stats");
            if (!res.ok) throw new Error(res.status);
            return await res.json();
        } catch (e) {
            console.error("[DebugMenu] failed to fetch ship stats:", e);
            return null;
        }
    }
}
