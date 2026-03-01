"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entity_registry_1 = __importDefault(require("../engine/entity-registry"));
const message_system_1 = __importDefault(require("../systems/message-system"));
const world_1 = __importDefault(require("../engine/world"));
const movement_system_1 = __importDefault(require("../systems/movement-system"));
const physics_system_1 = __importDefault(require("../systems/physics-system"));
const projectile_system_1 = __importDefault(require("../systems/projectile-system"));
const game_engine_1 = __importDefault(require("../engine/game-engine"));
const player_controller_1 = __importDefault(require("../controllers/player-controller"));
const ship_controller_1 = __importDefault(require("../controllers/ship-controller"));
const world_controller_1 = __importDefault(require("../controllers/world-controller"));
const upgrade_handler_1 = __importDefault(require("../handlers/upgrade-handler"));
const entity_factory_1 = __importDefault(require("../entities/entity-factory"));
const message_controller_1 = __importDefault(require("../controllers/message-controller"));
/**
 * Creates new game worlds. All dependencies - systems, registries, game engine, are created
 * and provided to the world here. This allows the creation of multiple worlds, if needed, and
 * encapsulates the world creation logic in one place. It serves as the composition root for
 * the "world-scoped" entities- there exists a one-to-many relationship between the worldManager
 * and the managed Worlds.
 */
class WorldFactory {
    entityConfig;
    worldConfig;
    constructor(entityConfig, worldConfig) {
        this.entityConfig = entityConfig;
        this.worldConfig = worldConfig;
    }
    createWorld(worldId) {
        const entityFactory = new entity_factory_1.default(this.entityConfig);
        const entityRegistry = new entity_registry_1.default();
        // Create all the systems the gameEngine depends on
        const systems = {
            physicsSystem: new physics_system_1.default(entityRegistry),
            movementSystem: new movement_system_1.default(entityRegistry),
            projectileSystem: new projectile_system_1.default(entityRegistry),
            messageSystem: new message_system_1.default()
        };
        // Pass systems into the game engine, then to the world
        const gameEngine = new game_engine_1.default(systems);
        // Create handlers for dependent controllers
        const upgradeHandler = new upgrade_handler_1.default(this.entityConfig);
        // Create all the controllers the gameController depends on
        const controllers = {
            playerController: new player_controller_1.default(entityRegistry, upgradeHandler),
            shipController: new ship_controller_1.default(entityRegistry),
            messageController: new message_controller_1.default()
        };
        // Pass controllers to the worldController, then to the world
        const worldController = new world_controller_1.default(entityRegistry, controllers);
        const world = new world_1.default(worldId, entityRegistry, entityFactory, gameEngine, worldController);
        world.setConfig(this.worldConfig);
        world.start();
        return world;
    }
}
exports.default = WorldFactory;
