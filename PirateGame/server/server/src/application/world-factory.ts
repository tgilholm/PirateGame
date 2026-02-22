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

export interface WorldConfig {
    worldId: string;
    maxPlayers: number;
}

/**
 * Creates new game worlds. All dependencies - systems, registries, game engine, are created
 * and provided to the world here. This allows the creation of multiple worlds, if needed, and
 * encapsulates the world creation logic in one place.
 */
export default class WorldFactory {
    constructor(
        private upgradeConfig: any) {
    }


    getSharedConfig(): WorldConfig {
        return {
            worldId: '',
            maxPlayers: 32
        }
    }

    /**
     * Creates and returns the world object with the injected dependencies.
     * @param config 
     * @returns 
     */
    createWorld(worldId: string, config: any): World {
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


        // Create all the controllers the gameController depends on
        const controllers: GameControllers = {
            playerController: new PlayerController(entityRegistry),
            shipController: new ShipController(entityRegistry)
        };

        // Pass controllers to the worldController, then to the world
        const worldController = new WorldController(entityRegistry, controllers);


        const world = new World(
            entityRegistry,
            gameEngine,
            worldController
        );

        world.start();
        return world;
    }
}