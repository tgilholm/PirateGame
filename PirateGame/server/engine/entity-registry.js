import Entity from "../entities/entity.js";
import NPC from "../entities/npc.js";
import Player from "../entities/player.js";
import Ship from "../entities/ship.js";

/**
 * Repository-pattern class implementing CRUD (create, retrieve, update, delete) methods
 * on all entity-derived types. Holds a list of all the entities currently in-game.
 */
export default class EntityRegistry {
    static entities = new Map();
    static entitiesByType = new Map();

    static initialise() {
        this.entities.clear();
        this.entitiesByType.clear();

        console.log('[EntityRegistry] Initialised entity registry');
    }

    /**
     * Adds a new Entity object to the list
     * @template {Entity} T the entity superclass
     * @param {T} entity the entity (or subclass)
     */
    static addEntity(entity) {
        this.entities.set(entity.id, entity);

        if (!this.entitiesByType.has(entity.type)) {
            this.entitiesByType.set(entity.type, []);
        }

        this.entitiesByType.get(entity.type).push(entity);

        console.log(`[Registry] Added ${entity.type}: ${entity.id}`); // E.g. ship: 1234
    }

    /**
     * Gets an entity by its string ID
     * @param {String} id 
     * @returns {Entity} the entity, or null if not found
     */
    static getEntity(id) {
        return this.entities.get(id);
    }


    /**
     * Gets all the entities in the game
     * @returns {Entity[]} all the entities currently in-game
     */
    static getAllEntities() {
        return Array.from(this.entities.values());
    }


    /**
     * Removes an entity by its unique ID, if it can be found first
     * @param {String} id 
     */
    static removeEntity(id) {
        const entity = this.entities.get(id);
        if (!entity) return false;

        // Remove from entities map
        this.entities.delete(id);

        // Remove from type index
        const typeList = this.entitiesByType.get(entity.type);
        if (typeList) {
            const index = typeList.findIndex(e => e.id === id);
            if (index >= 0) typeList.splice(index, 1);
        }

        console.log(`[Registry] Removed ${entity.type}: ${id}`);
        return true;
    }


    /**
     * Returns all the entities matching the specified type 
     * @param {String} type the type of entity to find
     * @returns {Entity[]} an array of entities, or an empty array if not found
     */
    static getEntitiesByType(type) {
        return this.entitiesByType.get(type) || [];
    }

    /**
     * Gets all the entities of type "ship"
     * @returns all ship entities, or null if not found
     */
    static getShips() {
        return this.getEntitiesByType('ship');
    }


    /**
     * Gets all the entities of type "player"
     * @returns all player entities, or null if not found
     */
    static getPlayers() {
        return this.getEntitiesByType('player');
    }



    /**
     * Gets all the entities of type "NPC"
     * @returns all NPC entities, or null if not found
     */
    static getNPCs() {
        return this.getEntitiesByType('npc');
    }


    /**
     * Gets a specific ship by its ID, or null if it can't be found
     * @param {String} id the id of the ship
     * @returns the ship, or null if not found
     */
    static getShip(id) {
        const entity = this.entities.get(id);
        return entity && entity.type === 'ship' ? entity : null;
    }

    /**
     * Gets a specific player by its ID, or null if it can't be found
     * @param {String} id the id of the player
     * @returns the player, or null if not found
     */
    static getPlayer(id) {
        const entity = this.entities.get(id);
        return entity && entity.type === 'player' ? entity : null;
    }

    /**
     * Gets a specific NPC by its ID, or null if it can't be found
     * @param {String} id the id of the NPC
     * @returns {NPC} the NPC, or null if not found
     */
    static getNPC(id) {
        const entity = this.entities.get(id);
        return entity && entity.type === 'npc' ? entity : null;
    }


    /**
     * Creates and adds a Ship (server-side) with the specified id and coordinates,
     * and adds it to the entity list.
     * @param {String} id unique id of the ship
     * @param {Number} x the x coordinate
     * @param {Number} y the y coordinate
     * @returns {Ship} the ship added to the list
     */
    static createShip(id, x, y) {
        const ship = new Ship(id, x, y);
        this.addEntity(ship);
        return ship;
    }


    /**
     * Creates and adds a Player (server-side) with the specified id, username, parent id
     * and coordinates, then adds it to the entity list. Note that if a parent id is specified,
     * then the coordinates given will be *local* coordinates, not absolute.
     * @param {String} id unique id of the player
     * @param {Number} x the x coordinate
     * @param {Number} y the y coordinate
     * @param {String} parentId the id of the parent object to place this player on
     * @param {String} username the username of the player
     * @returns {Player} the player object added 
     */
    static createPlayer(id, x, y, parentId, username) {
        const player = new Player(id, x, y, parentId, username);
        this.addEntity(player);
        return player;
    }


    /**
     * Creates a NPC (server-side) with the specified id and coordinates,
     * and adds it to the entity list. Note that if a parent id is specified,
     * then the coordinates given will be *local* coordinates, not absolute.
     * @param {String} id unique id of the npc
     * @param {Number} x the x coordinate
     * @param {Number} y the y coordinate
     * @returns {NPC} the npc added to the list
     */
    static createNPC(id, name, x, y) {
        const npc = new NPC(id, name, x, y);
        this.addEntity(npc);
        return npc;
    }


    /**
     * Gets all the players "on" a ship- those with a parentId matching the ship's id
     * @param {String} shipId the ship to compare against the players' parentId
     * @returns {Entity[]} the list of all players on the ship
     */
    static getPlayersOnShip(shipId) {
        return this.getPlayers().filter(p => p.parentId === shipId);
    }

    /**
     * Gets the ship being currently being steered by the player with the specified id,
     * or null if that ship cannot be found
     * @param {String} playerId the id of the player steering the ship
     * @returns {Entity} the ship being piloted by the player with id playerId
     */
    static getShipPilotedBy(playerId) {
        // @ts-ignore
        return this.getShips().find(ship => ship.pilotId === playerId) || null;
    }

    /**
     * Get all the entities near a specified x, y coordinate within a specified radius
     * @param {Number} x the x coordinate
     * @param {Number} y the y coordinate
     * @param {Number} radius the radius of the circle in which to find entities
     * @returns {Entity[]} all the entities within the radius
     */
    static getEntitiesNear(x, y, radius) {
        return this.getAllEntities().filter(entity => {
            const dx = entity.position.x - x;
            const dy = entity.position.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist <= radius;
        });
    }


    /**
     * Gets the initial setup data for ship objects, to be sent to clients for drawing
     * @returns {Object} the ship initialisation data
     */
    static getShipData() {
        return this.getShips().map(ship => ship.toData());
    }

    /**
     * Gets the data for all the player object
     * @returns {Object} the data for players
     */
    static getPlayerData() {
        return this.getPlayers().map(p => p.toData());
    }


    /**
     * Gets an object containing all the details for the entities in the registry
     * @returns an object with the entity data
     */
    static getStats() {
        return {
            totalEntities: this.entities.size,
            byType: {
                player: this.getPlayers().length,
                ship: this.getShips().length,
                npc: this.getNPCs().length,
            }
        };
    }

    /**
     * Removes all entities
     */
    static clear() {
        this.entities.clear();
        this.entitiesByType.clear();
    }

}