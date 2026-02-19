import Entity from "../entities/entity.js";
import NPC from "../entities/npc.js";
import Player from "../entities/player.js";
import Ship from "../entities/ship.js";

/**
 * Repository-pattern class implementing CRUD (create, retrieve, update, delete) methods
 * on all entity-derived types. Holds a list of all the entities currently in-game.
 */
export default class EntityRegistry {
    constructor() {
        this.entities = {}; // All the entities currently in-game
        this.entitiesByType = {};   // Internal, for grouping by type
    }

    /**
     * Adds a new Entity object to the list
     * @template {Entity} T the entity superclass
     * @param {T} entity the entity (or subclass)
     * @returns {T} the entity (or subclass) just added
     */
    addEntity(entity) {
        this.entities[entity.id] = entity;

        // Check if this entity type already exists- if not, add it
        if (!this.entitiesByType[entity.type]) {
            this.entitiesByType[entity.type] = {};
        }

        this.entitiesByType[entity.type][entity.id] = entity;   // Emplace the entity of that type by their id

        console.log(`[Registry] Added ${entity.type}: ${entity.id}`); // E.g. ship: 1234
        return entity;
    }

    /**
     * Gets an entity by its string ID
     * @param {String} id 
     * @returns the entity, or null if not found
     */
    getEntity(id) {
        return this.entities[id] || null; // return null if not found instead of crashing
    }


    /**
     * Gets all the entities in the game
     * @returns {Entity[]} all the entities currently in-game
     */
    getAllEntities() {
        return Object.values(this.entities);
    }


    /**
     * Removes an entity by its unique ID, if it can be found first
     * @param {String} id 
     */
    removeEntity(id) {
        const entity = this.entities[id];   // destructure before deleting
        if (entity) {   // Only delete if it actually exists
            delete this.entities[id];
            if (this.entitiesByType[entity.type]) {
                delete this.entitiesByType[entity.type][id];
            }
            console.log(`[Registry] Removed ${entity.type}: ${id}`);
        }
    }


    /**
     * Checks if an entity exists in the list by its id
     * @param {String} id the unique id of the entity
     * @returns {Boolean} true if found, false otherwise
     */
    hasEntity(id) {
        return id in this.entities; // "in" returns true if the id is found in the list
    }


    /**
     * Returns all the entities matching the specified type 
     * @param {String} type the type of entity to find
     * @returns {Entity[]} an array of entities, or null if not found
     */
    getEntitiesByType(type) {
        return Object.values(this.entitiesByType[type] || {});  // empty object if not found
    }

    /**
     * Gets all the entities of type "ship"
     * @returns all ship entities, or null if not found
     */
    getShips() {
        return this.getEntitiesByType('ship');
    }


    /**
     * Gets all the entities of type "player"
     * @returns all player entities, or null if not found
     */
    getPlayers() {
        return this.getEntitiesByType('player');
    }


    /**
     * Gets all the entities of type "NPC"
     * @returns all NPC entities, or null if not found
     */
    getNPCs() {
        return this.getEntitiesByType('npc');
    }


    /**
     * Gets a specific ship by its ID, or null if it can't be found
     * @param {String} id the id of the ship
     * @returns the ship, or null if not found
     */
    getShip(id) {
        const entity = this.getEntity(id);
        return entity && entity.type === 'ship' ? entity : null;
    }

    /**
     * Gets a specific player by its ID, or null if it can't be found
     * @param {String} id the id of the player
     * @returns the player, or null if not found
     */
    getPlayer(id) {
        const entity = this.getEntity(id);
        return entity && entity.type === 'player' ? entity : null;
    }

    /**
     * Gets a specific NPC by its ID, or null if it can't be found
     * @param {String} id the id of the NPC
     * @returns {NPC} the NPC, or null if not found
     */
    getNPC(id) {
        const entity = this.getEntity(id);
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
    createShip(id, x, y) {
        const ship = new Ship(id, x, y);
        return this.addEntity(ship);
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
    createPlayer(id, x, y, parentId, username) {
        const player = new Player(id, x, y, parentId, username);
        return this.addEntity(player);
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
    createNPC(id, name, x, y) {
        const npc = new NPC(id, name, x, y);
        return this.addEntity(npc);
    }


    /**
     * Gets all the players "on" a ship- those with a parentId matching the ship's id
     * @param {String} shipId the ship to compare against the players' parentId
     * @returns {Entity[]} the list of all players on the ship
     */
    getPlayersOnShip(shipId) {
        return this.getPlayers().filter(p => p.parentId === shipId);
    }

    /**
     * Gets all the players "off" ships- those with a parentId of null.
     * @returns {Entity[]} the list of all players not on ships
     */
    getPlayersInWorldSpace() {
        return this.getPlayers().filter(p => p.parentId === null);
    }

    /**
     * Gets the ship being currently being steered by the player with the specified id,
     * or null if that ship cannot be found
     * @param {String} playerId the id of the player steering the ship
     * @returns {Entity} the ship being piloted by the player with id playerId
     */
    getShipPilotedBy(playerId) {
        return this.getShips().find(s => s.pilotId === playerId) || null;
    }

    /**
     * Get all the entities near a specified x, y coordinate within a specified radius
     * @param {Number} x the x coordinate
     * @param {Number} y the y coordinate
     * @param {Number} radius the radius of the circle in which to find entities
     * @returns {Entity[]} all the entities within the radius
     */
    getEntitiesNear(x, y, radius) {
        return this.getAllEntities().filter(entity => {
            const dx = entity.position.x - x;
            const dy = entity.position.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist <= radius;
        });
    }

    /**
     * 
     * Get all the entities near a specified x, y coordinate within a specified radius,
     * and matching the specified type
     * @param {Number} x the x coordinate
     * @param {Number} y the y coordinate
     * @param {Number} radius the radius of the circle in which to find entities
     * @param {String} type the type to filter by
     * @returns 
     */
    getEntitiesNearByType(x, y, radius, type) {
        return this.getEntitiesByType(type).filter(entity => {
            const dx = entity.position.x - x;
            const dy = entity.position.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist <= radius;
        });
    }


    /**
     * Gets the data for all the entities currently in the list
     * @returns {Object} the data for all entities
     */
    getEntityData() {
        const data = {};
        Object.entries(this.entitiesByType).forEach(([type, entitiesByType]) => {
            data[type] = Object.values(entitiesByType).map(e => e.toData());
        });
        return data;
    }

    /**
     * Gets the initial setup data for ship objects, to be sent to clients for drawing
     * @returns {Object} the ship initialisation data
     */
    getShipInitData() {
        /** @type {Ship[]} */ const shipData = {};
        this.getShips().forEach(ship => {
            shipData[ship.id] = {
                x: ship.position.x,
                y: ship.position.y,
                r: ship.rotation,
                params: ship.getParams()
            };
        });
        return shipData;
    }

    /**
     * Gets the data for all the player object
     * @returns {Object} the data for players
     */
    getPlayerData() {
        return this.getPlayers().map(p => p.toData());
    }


    /**
     * Gets an object containing all the details for the entities in the registry
     * @returns an object with the entity data
     */
    getStats() {
        const stats = {
            totalEntities: Object.keys(this.entities).length,
            byType: {}
        };

        Object.entries(this.entitiesByType).forEach(([type, entities]) => {
            stats.byType[type] = Object.keys(entities).length;
        });

        return stats;
    }


    /**
     * Use for debugging
     */
    debug() {
        console.log('EntityRegistry Debug');
        const stats = this.getStats();
        console.log(`Total entities: ${stats.totalEntities}`);
        console.log('By type:', stats.byType);

        Object.entries(this.entitiesByType).forEach(([type, entities]) => {
            console.log(`\n${type}s:`);
            Object.values(entities).forEach(e => {
                console.log(`  - ${e.id}${e.name ? ` (${e.name})` : ''}${e.username ? ` [${e.username}]` : ''}`);
            });
        });
    }


    /**
     * Removes all entities
     */
    clear() {
        this.entities = {};
        this.entitiesByType = {};
    }

}