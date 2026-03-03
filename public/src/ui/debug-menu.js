// import DomFactory from "./dom-factory.js";
// import ui-config from "./ui-config.json" with { type: "json" };

// /**
//  * debug-menu — togglable panel with one row per ship component and one button
//  * per variant. Fetches component data from /api/types on init().
//  *
//  * Usage:
//  *   const debug-menu = new debug-menu(scene);
//  *   debug-menu.init(); // async — safe to fire-and-forget
//  */
// export default class debug-menu {

//     /**
//      * @param {Phaser.Scene} scene - The active Phaser scene (used for keyboard binding).
//      */
//     constructor(scene) {
//         this.scene = scene;
//         this.visible = false;

//         // Build the menu container and add it to the page
//         this.menuEl = DomFactory.createElement("div", [], { id: "debug-menu" });
//         this.menuEl.style.display = "none";

//         const heading = DomFactory.createElement("h3");
//         heading.textContent = "Debug Menu";
//         this.menuEl.appendChild(heading);

//         document.body.appendChild(this.menuEl);

//         // Wire the toggle key from ui-config
//         const key = this.scene.input.keyboard.addKey(
//             Phaser.Input.Keyboard.KeyCodes[ui-config.DEBUG_MENU.TOGGLE_KEY]
//         );
//         key.on("down", () => this.toggle());
//         this.scene.events.once("shutdown", () => key.off("down"));
//     }

//     //fetches /api/types, one row per component, one column per variant

//     async init() {
//         let types;
//         try {
//             const res = await fetch("/api/types");
//             if (!res.ok) throw new Error(`HTTP ${res.status}`);
//             types = await res.json();
//         } catch (e) {
//             console.error("[debug-menu] Failed to fetch component types:", e);
//             return;
//         }

//         for (const [componentKey, componentData] of Object.entries(types.components)) {
//             const buttons = Object.keys(componentData.variants).map(variant => ({
//                 label: variant,
//                 onClick: () => this.applyComponent(componentKey, variant)
//             }));

//             const section = DomFactory.createSection(componentData.name, buttons);
//             section.dataset.componentKey = componentKey;
//             this.menuEl.appendChild(section);
//         }
//     }

//     //Shows or hides debug menu 
//     toggle() {
//         this.visible = !this.visible;
//         this.menuEl.style.display = this.visible ? "block" : "none";
//     }

//     /**
//      * POSTs the chosen variant to the server and highlights the active button.
//      * @param {string} componentType
//      * @param {string} variant
//      */
//     async applyComponent(componentType, variant) {
//         try {
//             await fetch("/api/component", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ componentType, variant })
//             });
//             this.highlightButton(componentType, variant);
//         } catch (e) {
//             console.error("[debug-menu] Failed to apply component:", e);
//         }
//     }

//     /**
//      * Marks the clicked variant button as active, clears the rest in that row.
//      * @param {string} componentType
//      * @param {string} variant
//      */
//     highlightButton(componentType, variant) {
//         this.menuEl.querySelectorAll(".debug-section[data-component-key]").forEach(section => {
//             if (section.dataset.componentKey === componentType) {
//                 section.querySelectorAll("button").forEach(btn => {
//                     btn.classList.toggle("active", btn.textContent === variant);
//                 });
//             }
//         });
//     }
// }




