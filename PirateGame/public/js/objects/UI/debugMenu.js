import CreateUI from "./createUI.js";
import UI_CONFIG from "./UIConfig.json" with { type: "json" };

/**
 * DebugMenu — owns the entire debug panel: DOM creation, CSS injection,
 * component-switcher sections, stats overlay, and the X-key toggle.
 *
 * Usage:
 *   const debugMenu = new DebugMenu(scene);
 *   debugMenu.init(); // async — safe to fire-and-forget
 *
 * Adding or removing components/variants in types.json is all that is needed
 * to update the component sections — no HTML, CSS, or JS changes required.
 */
export default class DebugMenu {

    /**
     * @param {Phaser.Scene} scene - The active Phaser scene (used for keyboard binding).
     * @param {Function} [onComponentChange]
     *   Optional external callback fired after a variant is applied.
     *   Signature: (componentType: string, variant: string, updatedStats: Object|null) => void
     */
    constructor(scene, onComponentChange = null) {
        this.scene = scene;
        this.onComponentChange = onComponentChange;
        this.menuVisible = false;
        this.statsVisible = false;
        this.types = null; // populated in init()

        // Build all DOM elements via CreateUI
        const { menu, statsSection, statsBtn, statsOverlay, statsContent } =
            CreateUI.createDebugMenuDOM();

        this.menuEl       = menu;
        this.statsSection = statsSection; // component sections are inserted before this
        this.statsBtn     = statsBtn;
        this.statsOverlay = statsOverlay;
        this.statsContent = statsContent;

        this._wireEvents();
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /**
     * Fetches component types from /api/types and populates the menu with
     * one button-row per component.  Safe to call once; resolves async.
     */
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
                onClick: () => this._applyComponent(componentKey, variant)
            }));

            const section = CreateUI.createSection(componentData.name, buttons);
            section.dataset.componentKey = componentKey;

            // Always keep the stats button at the bottom
            this.menuEl.insertBefore(section, this.statsSection);
        }

        // Keep window.setComponent wired for console/external callers
        window.setComponent = (componentType, variant) =>
            this._applyComponent(componentType, variant);
    }

    /** Shows or hides the debug menu panel. */
    toggle() {
        this.menuVisible = !this.menuVisible;
        this.menuEl.style.display = this.menuVisible ? "block" : "none";
    }

    // -------------------------------------------------------------------------
    // Private — event wiring
    // -------------------------------------------------------------------------

    _wireEvents() {
        // Print-stats button
        this.statsBtn.addEventListener("click", async () => {
            const stats = await this._fetchShipStats();
            if (stats) {
                console.log("=== SHIP STATS ===", stats);
                this._toggleStatsOverlay(stats);
            }
        });

        // X key toggles the debug menu
        this.debugKey = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes[UI_CONFIG.DEBUG_MENU.TOGGLE_KEY]
        );
        this.debugKey.on("down", () => this.toggle());

        // Clean up on scene shutdown
        this.scene.events.once("shutdown", () => {
            this.debugKey?.off("down");
            this.debugKey = null;
        });
    }

    // -------------------------------------------------------------------------
    // Private — component application
    // -------------------------------------------------------------------------

    /**
     * POSTs the chosen component variant to the server, highlights the button,
     * and fires onComponentChange with the returned stats.
     */
    async _applyComponent(componentType, variant) {
        try {
            const res = await fetch("/api/component", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ componentType, variant })
            });

            this._highlightButton(componentType, variant);

            const updatedStats = res.ok ? await res.json() : null;

            // Refresh overlay if it is open
            if (this.statsVisible && updatedStats) {
                this._updateStatsOverlay(updatedStats);
            }

            // Notify any external listener
            if (this.onComponentChange) {
                this.onComponentChange(componentType, variant, updatedStats);
            }
        } catch (e) {
            console.error("[DebugMenu] Failed to apply component:", e);
        }
    }

    /** Marks the chosen variant button as active and clears the others in that row. */
    _highlightButton(componentType, variant) {
        this.menuEl.querySelectorAll(".debug-section[data-component-key]").forEach(section => {
            if (section.dataset.componentKey === componentType) {
                section.querySelectorAll("button").forEach(btn => {
                    btn.classList.toggle("active", btn.textContent === variant);
                });
            }
        });
    }

    // -------------------------------------------------------------------------
    // Private — stats overlay
    // -------------------------------------------------------------------------

    _toggleStatsOverlay(stats) {
        if (this.statsVisible) {
            this.statsOverlay.style.display = "none";
            this.statsVisible = false;
            return;
        }
        this._updateStatsOverlay(stats);
        this.statsOverlay.style.display = "block";
        this.statsVisible = true;
    }

    /**
     * Derives ordered, deduplicated stat keys from types.components[*].affects.
     * Falls back to Object.keys(stats) if types haven't loaded yet.
     * @returns {string[]}
     */
    _getStatKeys(stats) {
        const seen = new Set();
        const keys = [];
        if (this.types?.components) {
            for (const componentData of Object.values(this.types.components)) {
                for (const key of (componentData.affects ?? [])) {
                    if (!seen.has(key)) { seen.add(key); keys.push(key); }
                }
            }
        }
        // Fall back to whatever the server returned if types not loaded
        for (const key of Object.keys(stats)) {
            if (!seen.has(key)) { seen.add(key); keys.push(key); }
        }
        return keys;
    }

    /**
     * Converts a camelCase key to "Title Case" label.
     * e.g. "cannonDamage" → "Cannon Damage"
     * @param {string} key
     * @returns {string}
     */
    _camelToTitle(key) {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, c => c.toUpperCase());
    }

    _updateStatsOverlay(stats) {
        const keys = this._getStatKeys(stats);

        this.statsContent.innerHTML = keys
            .map(key => {
                const raw = stats[key];
                const display = (typeof raw === "number")
                    ? parseFloat(raw.toPrecision(6))
                    : (raw ?? "N/A");
                return `
                <div class="stat-row">
                    <span class="stat-label">${this._camelToTitle(key)}</span>
                    <span class="stat-value">${display}</span>
                </div>`;
            })
            .join("");
    }

    async _fetchShipStats() {
        try {
            const res = await fetch("/api/stats");
            if (!res.ok) throw new Error(res.status);
            return await res.json();
        } catch (e) {
            console.error("[DebugMenu] Failed to fetch ship stats:", e);
            return null;
        }
    }
}
