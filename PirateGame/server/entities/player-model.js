import Entity from "./entity";

export default class PlayerModel extends Entity{
    /**
     * 
     * @param {String} id 
     * @param {Number} x 
     * @param {Number} y 
     * @param {String} parentId 
     * @param {String} username 
     */
    constructor(id, x, y, parentId = null, username = "")
    {
        super(id, "player", x, y);  // All players have type "player"
    }
}