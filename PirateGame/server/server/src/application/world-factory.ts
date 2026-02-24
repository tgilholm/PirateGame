import EntityRegistry from "../engine/entity-registry";
import MessageSystem from "../systems/message-system";
import World from "../engine/world";
import MovementSystem from "../systems/movement-system";
import PhysicsSystem from "../systems/physics-system";
import ProjectileSystem from "../systems/projectile-system";
import GameEngine, { GameSystems } from "../engine/game-engine";
import PlayerController from "../controllers/player-controller";
import ShipController from "../controllers/ship-controller";
import WorldController, { GameControllers } from "../controllers/world-controller";
import UpgradeHandler from "../handlers/upgrade-handler";
import EntityFactory from "../entities/entity-factory";
import { EntityConfig } from "../types";



/**
 * Creates new game worlds. All dependencies - systems, registries, game engine, are created
 * and provided to the world here. This allows the creation of multiple worlds, if needed, and
 * encapsulates the world creation logic in one place. It serves as the composition root for
 * the "world-scoped" entities- there exists a one-to-many relationship between the worldManager
 * and the managed Worlds.
 */
export default class WorldFactory {
    constructor(
        private entityConfig: EntityConfig,
        private worldConfig: any) {
    }


    createWorld(worldId: string): World {
        const entityFactory = new EntityFactory(this.entityConfig);
        const entityRegistry = new EntityRegistry();

        // Create all the systems the gameEngine depends on
        const systems: GameSystems = {
            physicsSystem: new PhysicsSystem(entityRegistry),
            movementSystem: new MovementSystem(entityRegistry),
            projectileSystem: new ProjectileSystem(entityRegistry),
            messageSystem: new MessageSystem()
        };

        // Pass systems into the game engine, then to the world
        const gameEngine = new GameEngine(systems);

        // Create handlers for dependent controllers
        const upgradeHandler = new UpgradeHandler(this.entityConfig);

        // Create all the controllers the gameController depends on
        const controllers: GameControllers = {
            playerController: new PlayerController(entityRegistry, upgradeHandler),
            shipController: new ShipController(entityRegistry)
        };

        // Pass controllers to the worldController, then to the world
        const worldController = new WorldController(entityRegistry, controllers);


        const world = new World(
            worldId,
            entityRegistry,
            entityFactory,
            gameEngine,
            worldController
        );

        world.setConfig(this.worldConfig);
        world.start();
        return world;
    }
}