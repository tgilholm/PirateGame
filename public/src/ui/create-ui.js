 //import DebugMenu from "./debugMenu.js";
 import ShopUI from "./shop-ui.js";
 import Minimap from "./minimap.js";


 //Contains UI creation logic
 export default class CreateUI {
     /**
      * @param {Phaser.Scene} scene - The active Phaser scene used to create Phaser text objects and bind keyboard input
      */
     constructor(scene) {
         this.scene = scene;

         //minimap
         this.minimap = new Minimap(document.getElementById("minimap-container"));

         //debug menu — builds its own DOM, wires X key and stats button
//         this.debugMenu = new DebugMenu(scene);
//         this.debugMenu.init();

         //shop UI — builds its own DOM and appends to document.body
         this.shopUI = new ShopUI();

//         //interaction prompt
//         this.promptEl = document.getElementById("interaction-prompt");
    }
}
