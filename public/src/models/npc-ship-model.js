import NPCModel from "./npc-model.js";


export default class NPCShipModel extends NPCModel {
    /**
     * 
     * @param {Phaser.Scene} scene 
     * @param {string} id 
     * @param {number} x 
     * @param {number} y 
     * @param {NPCShipConfig} config 
     */
    constructor(scene, id, x, y, config) {
        super(scene, id, x, y)
    }
}